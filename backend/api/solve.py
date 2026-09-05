from fastapi import APIRouter

from backend.schemas.solve import SolveRequest

from backend.solver.solver_registry import get_solver

from backend.models.vrp_problem import VRPProblem

from backend.api.adapter import (
    convert_distance_matrix,
    convert_demands
)

router = APIRouter()


@router.post("/solve")
def solve_vrp(request: SolveRequest):

    solver = get_solver(request.algorithm)

    distance_matrix = convert_distance_matrix(
        request.distance_matrix
    )

    demands = convert_demands(
        request.demands
    )

    problem = VRPProblem(
        cities=request.cities,
        depot=request.depot,
        demands=demands,
        capacity=request.capacity,
        distance_matrix=distance_matrix,
        num_vehicles=request.num_vehicles
    )

    result = solver.solve(problem)

    formatted_routes = []

    for index, route in enumerate(result.routes):
        formatted_routes.append(
            {
                "vehicle_id": index + 1,
                "path": route
            }
        )

    return {
        "algorithm": result.algorithm,
        "routes": formatted_routes,
        "total_distance": result.total_distance
    }