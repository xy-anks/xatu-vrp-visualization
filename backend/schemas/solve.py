from pydantic import BaseModel, Field
from typing import List, Optional


class OrderInput(BaseModel):
    """
    One client-supplied order for 'custom' mode (Order Layer input).

    customer_id must reference an existing customer node in the scene;
    this is enforced when the problem is built.
    """

    customer_id: str = Field(
        ...,
        description="Stable scene node id the order ships to"
    )
    demand: int = Field(
        ...,
        ge=1,
        description="Delivery quantity (must be >= 1)"
    )


class SimulationConfig(BaseModel):
    """
    Dynamic parameters for one simulation run (Simulation Layer).

    These never live in a scene json: the scene describes the static
    world, while orders and vehicles are generated per request.

    mode:
      - "random": backend generates order_count random orders
      - "custom": frontend supplies the exact orders in `orders`
    """

    mode: str = "random"
    order_count: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of orders to generate (random mode)"
    )
    vehicle_count: int = Field(
        default=2,
        ge=1,
        description="Number of available vehicles"
    )
    capacity: int = Field(
        default=30,
        ge=1,
        description="Capacity per vehicle"
    )
    seed: Optional[int] = Field(
        default=None,
        description="Random seed for reproducible order generation"
    )
    orders: Optional[List[OrderInput]] = Field(
        default=None,
        description="Client-supplied orders (custom mode)"
    )


class SolveRequest(BaseModel):
    """
    Request from frontend.
    """
    scene: str
    algorithm: str
    config: SimulationConfig


class RouteResponse(BaseModel):
    """
    One vehicle route. Node ids are stable scene node ids (strings),
    e.g. ["depot", "dorm_1", "dorm_9", "depot"].
    """
    vehicle_id: int
    route: List[str]


class SolveResponse(BaseModel):
    """
    Unified response returned by API.
    """
    scene: str
    algorithm: str
    routes: List[RouteResponse]
    total_distance: float


class ComparisonItem(BaseModel):
    """
    One algorithm's result in a comparison run.
    """
    algorithm: str
    vehicle_count: int
    total_distance: float
    solve_time: int  # milliseconds


class ComparisonResponse(BaseModel):
    """
    Response for POST /solve/compare:
    results from multiple algorithms on the same orders + vehicles.
    """
    scene: str
    results: List[ComparisonItem]

