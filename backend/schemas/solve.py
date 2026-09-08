from pydantic import BaseModel
from typing import List

class SolveRequest(BaseModel):
    """
    Request from frontend.
    Only choose algorithm.
    """
    algorithm: str

class RouteResponse(BaseModel):
    """
    One vehicle route.
    """
    vehicle_id: int
    route: List[int]

class SolveResponse(BaseModel):
    """
    Unified response returned by API.
    """
    algorithm: str
    routes: List[RouteResponse]
    total_distance: float