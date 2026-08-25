from backend.solver.nearest_neighbor import NearestNeighborSolver
from backend.solver.savings import SavingsSolver
from backend.solver.gurobi_solver import GurobiSolver

SOLVERS = {
    "nearest_neighbor": NearestNeighborSolver,
    "savings": SavingsSolver,
    "gurobi": GurobiSolver
}

def get_solver(name):
    """
    Return a solver instance by name.
    """

    if name not in SOLVERS:
        raise ValueError(
            f"Unknown solver: {name}"
        )

    return SOLVERS[name]()