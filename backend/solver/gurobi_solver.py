import gurobipy as gp
from gurobipy import GRB

from backend.solver.base_solver import BaseSolver
from backend.solver.solver_result import SolverResult

def extract_routes(x, cities, depot):
    """
    Reconstruct routes from the optimal edge variables x.

    Start from every customer directly connected to the depot,
    then follow outgoing edges until returning to the depot.
    """
    routes = []
    for customer in cities:
        if x[depot, customer].X > 0.5:
            route = [depot, customer]
            current_node = customer
            while current_node != depot:
                found_next = False
                for next_node in cities + [depot]:
                    if next_node != current_node and x[current_node, next_node].X > 0.5:
                        route.append(next_node)
                        current_node = next_node
                        found_next = True
                        break
                if not found_next:
                    # Safety break: avoid infinite loops on numerical noise
                    break
            routes.append(route)
    return routes


class GurobiSolver(BaseSolver):
    """
    Exact CVRP solver using Gurobi (MTZ formulation).

    Requires a valid Gurobi license on the machine.
    Solver behavior is configured at construction time
    (time limit, log output) instead of per-call parameters.
    """

    name = "gurobi"
    description = "Exact solver via Gurobi (MTZ formulation)"

    def __init__(self, time_limit=60, output_flag=0):
        self.time_limit = time_limit    # solver time limit in seconds
        self.output_flag = output_flag  # 0 = silent, 1 = show Gurobi log

    def solve(self, problem):

        cities = problem.cities
        depot = problem.depot
        demands = problem.demands
        capacity = problem.capacity
        distance_matrix = problem.distance_matrix
        num_vehicles = problem.num_vehicles

        if num_vehicles is None:
            raise ValueError(
                "Gurobi solver requires num_vehicles "
                "(the vehicle count is a hard constraint in the model)"
            )

        nodes = [depot] + cities

        model = gp.Model("CVRP")
        model.setParam("TimeLimit", self.time_limit)
        model.setParam("OutputFlag", self.output_flag)

        # x[i,j] = 1 if a vehicle travels directly from i to j
        x = model.addVars(nodes, nodes, vtype=GRB.BINARY, name="x")
        # u[i] = cumulative load after serving customer i (MTZ)
        u = model.addVars(cities, lb=0, ub=capacity, vtype=GRB.CONTINUOUS, name="u")

        # Objective: minimize total travel distance
        model.setObjective(
            gp.quicksum(distance_matrix[i][j] * x[i, j]
                        for i in nodes for j in nodes if i != j),
            GRB.MINIMIZE
        )

        # Each customer is left exactly once
        for i in cities:
            model.addConstr(gp.quicksum(x[i, j] for j in nodes if j != i) == 1)

        # Each customer is entered exactly once
        for j in cities:
            model.addConstr(gp.quicksum(x[i, j] for i in nodes if i != j) == 1)

        # Exactly K vehicles leave and return to the depot
        model.addConstr(gp.quicksum(x[depot, j] for j in cities) == num_vehicles)
        model.addConstr(gp.quicksum(x[i, depot] for i in cities) == num_vehicles)

        # Load at each customer is at least its own demand
        for i in cities:
            model.addConstr(u[i] >= demands[i])

        # MTZ load propagation: eliminates subtours and enforces capacity
        for i in cities:
            for j in cities:
                if i != j:
                    model.addConstr(
                        u[i] - u[j] + capacity * x[i, j] <= capacity - demands[j]
                    )

        model.optimize()

        if model.status == GRB.OPTIMAL:
            routes = extract_routes(
                x,
                cities,
                depot
            )

            return SolverResult(
                routes=routes,
                total_distance=model.ObjVal,
                algorithm=self.name
            )
        
        else:
            print("No optimal solution found. Status:", model.status)
            return None

