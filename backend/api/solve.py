from fastapi import APIRouter

from backend.schemas.solve import (
    SolveRequest,
    SolveResponse,
    RouteResponse
)

from backend.solver.solver_registry import get_solver

from backend.utils.campus_loader import create_campus_problem


router = APIRouter()


@router.post("/solve", response_model=SolveResponse)
def solve_vrp(request: SolveRequest):

    problem = create_campus_problem(
        "data/campus.json"
    )


    solver = get_solver(
        request.algorithm
    )


    result = solver.solve(problem)


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