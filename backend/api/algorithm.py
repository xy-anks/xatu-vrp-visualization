from fastapi import APIRouter

from backend.solver.solver_registry import SOLVERS


router = APIRouter()


@router.get("/algorithms")
def get_algorithms():

    algorithms = []

    for name, solver in SOLVERS.items():

        algorithms.append(
            {
                "name": name,
                "description": solver.description
            }
        )

    return {
        "algorithms": algorithms
    }