from fastapi import APIRouter, HTTPException
from pathlib import Path

from backend.schemas.solve import (
    SolveRequest,
    SolveResponse,
    RouteResponse
)

from backend.solver.solver_registry import get_solver

from backend.utils.campus_loader import create_campus_problem


router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent.parent


@router.post("/solve", response_model=SolveResponse)
def solve_vrp(request: SolveRequest):

    problem = create_campus_problem(
        str(BASE_DIR / "data" / "campus.json")
    )


    solver = get_solver(
        request.algorithm
    )


    result = solver.solve(problem)


    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Solver failed to find a feasible solution."
        )


    routes = []

    for index, route in enumerate(result.routes):

        routes.append(
            RouteResponse(
                vehicle_id=index,
                route=route
            )
        )


    return SolveResponse(
        algorithm=result.algorithm,
        routes=routes,
        total_distance=result.total_distance
    )