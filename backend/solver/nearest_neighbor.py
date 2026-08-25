from backend.solver.base_solver import BaseSolver
from backend.solver.solver_result import SolverResult
from backend.utils.distance import calculate_total_distance

class NearestNeighborSolver(BaseSolver):
    """
    Greedy nearest neighbor heuristic.

    From the current node, always visit the nearest unvisited
    customer that still fits in the remaining vehicle capacity.
    Start a new route when no customer fits.
    """

    name = "nearest_neighbor"
    description = "Greedy nearest neighbor heuristic"

    def solve(self, problem):

        cities = problem.cities
        depot = problem.depot
        demands = problem.demands
        capacity = problem.capacity
        distance_matrix = problem.distance_matrix
        num_vehicles = problem.num_vehicles

        # ---- Capacity feasibility check ----

        total_demand = sum(demands[c] for c in cities)

        if num_vehicles is not None:

            max_total_capacity = num_vehicles * capacity

            if total_demand > max_total_capacity:
                raise ValueError(
                    f"INFEASIBLE: Total demand {total_demand} "
                    f"exceeds max total capacity "
                    f"{max_total_capacity} "
                    f"({num_vehicles} vehicles x capacity {capacity})"
                )

        else:

            max_single_demand = max(
                demands[c] for c in cities
            )

            if max_single_demand > capacity:
                raise ValueError(
                    f"INFEASIBLE: Max single demand "
                    f"{max_single_demand} exceeds "
                    f"vehicle capacity {capacity}"
                )

        min_vehicles_needed = (
            total_demand + capacity - 1
        ) // capacity

        print(
            f"[CVRP] Total demand: {total_demand}, "
            f"Vehicle capacity: {capacity}, "
            f"Min vehicles required: {min_vehicles_needed}"
        )

        if num_vehicles is not None:
            print(
                f"[CVRP] Available vehicles: {num_vehicles}"
            )

        # ---- Greedy nearest neighbor core ----

        unvisited = set(cities)

        routes = []

        current_route = [depot]

        current_load = 0

        current_node = depot

        vehicles_used = 0

        while unvisited:

            min_distance = float("inf")

            nearest_customer = None

            # Find the nearest feasible customer
            for node in unvisited:

                if current_load + demands[node] <= capacity:

                    if (
                        distance_matrix[current_node][node]
                        < min_distance
                    ):
                        min_distance = (
                            distance_matrix[current_node][node]
                        )

                        nearest_customer = node

            # A feasible customer was found
            if nearest_customer is not None:

                current_route.append(nearest_customer)

                current_load += demands[nearest_customer]

                unvisited.remove(nearest_customer)

                current_node = nearest_customer

            # No customer can fit in current vehicle
            else:

                current_route.append(depot)

                routes.append(current_route)

                vehicles_used += 1

                if (
                    num_vehicles is not None
                    and vehicles_used >= num_vehicles
                ):

                    if unvisited:

                        raise ValueError(
                            f"VEHICLE SHORTAGE: Used "
                            f"{vehicles_used} vehicles, "
                            f"but {len(unvisited)} customers "
                            f"remain unserved"
                        )

                current_route = [depot]

                current_load = 0

                current_node = depot

        # Close the last route
        if len(current_route) > 1:

            current_route.append(depot)

            routes.append(current_route)

            vehicles_used += 1

        total_distance = calculate_total_distance(
            routes,
            distance_matrix
        )

        return SolverResult(
            routes=routes,
            total_distance=total_distance,
            algorithm=self.name
        )