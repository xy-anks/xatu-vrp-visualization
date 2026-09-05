from pydantic import BaseModel
from typing import List, Optional


class SolveRequest(BaseModel):
    algorithm: str
    cities: list
    depot: int
    demands: dict
    capacity: int
    distance_matrix: dict
    num_vehicles: Optional[int] = None



class RouteResponse(BaseModel):
    vehicle_id: int
    path: list


class SolveResponse(BaseModel):
    algorithm: str
    routes: List[RouteResponse]