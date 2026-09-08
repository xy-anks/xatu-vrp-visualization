from backend.utils.campus_loader import create_campus_problem
from backend.utils.problem_adapter import convert_problem_to_solver_input

from backend.solver.nearest_neighbor import NearestNeighborSolver
from backend.solver.savings import SavingsSolver
from backend.solver.gurobi_solver import GurobiSolver



def run_solver(solver):

    problem = create_campus_problem(
        "data/campus.json"
    )

    result = solver.solve(problem)


    print("\nAlgorithm:", solver.name)

    print("Routes:")

    for route in result.routes:
        print(route)

    print("Total distance:",result.total_distance)



if __name__ == "__main__":


    # Test nearest neighbor

    run_solver(
        NearestNeighborSolver()
    )


    # Test savings

    run_solver(
        SavingsSolver()
    )


    # Test Gurobi

    run_solver(
        GurobiSolver()
    )