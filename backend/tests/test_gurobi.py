from backend.models.vrp_problem import VRPProblem
from backend.solver.gurobi_solver import GurobiSolver


def test_small_instance():

    cities = [1, 2, 3, 4]

    depot = 0

    demands = {
        1: 10,
        2: 8,
        3: 12,
        4: 7
    }

    capacity = 20

    num_vehicles = 2

    distance_matrix = {
        0: {0: 0, 1: 10, 2: 15, 3: 20, 4: 18},
        1: {0: 10, 1: 0, 2: 6, 3: 12, 4: 9},
        2: {0: 15, 1: 6, 2: 0, 3: 8, 4: 7},
        3: {0: 20, 1: 12, 2: 8, 3: 0, 4: 5},
        4: {0: 18, 1: 9, 2: 7, 3: 5, 4: 0},
    }

    problem = VRPProblem(
        cities=cities,
        depot=depot,
        demands=demands,
        capacity=capacity,
        distance_matrix=distance_matrix,
        num_vehicles=num_vehicles
    )

    solver = GurobiSolver(
        time_limit=30,
        output_flag=1
    )

    result = solver.solve(problem)

    print("Algorithm:", result.algorithm)
    print("Routes:", result.routes)
    print("Total distance:", result.total_distance)

    assert result.algorithm == "gurobi"
    assert result.routes is not None
    assert result.total_distance >= 0


if __name__ == "__main__":
    test_small_instance()