"""
Tests for 'custom' order mode: frontend-supplied orders drive the solve.

Covers:
  1. custom orders build a VRPProblem and the solver runs
  2. returned routes only visit nodes from the supplied orders
  3. an order referencing a non-existent node -> HTTP 400
  4. random mode still works (both modes coexist)
"""

from fastapi import HTTPException

from backend.api.solve import solve_vrp
from backend.schemas.solve import (
    SolveRequest,
    SimulationConfig,
    OrderInput,
)


def _custom_request(
    orders,
    algorithm="nearest_neighbor",
    scene="xatu-campus",
    vehicle_count=3,
    capacity=30,
):
    return SolveRequest(
        scene=scene,
        algorithm=algorithm,
        config=SimulationConfig(
            mode="custom",
            orders=[
                OrderInput(customer_id=cid, demand=demand)
                for cid, demand in orders
            ],
            vehicle_count=vehicle_count,
            capacity=capacity,
        ),
    )


def test_custom_orders_solve_successfully():
    """
    Custom orders [dorm_1:5, dorm_5:8] produce a feasible solution
    and the solver runs end to end.
    """

    response = solve_vrp(
        _custom_request(
            [("dorm_1", 5), ("dorm_5", 8)],
            vehicle_count=2,
            capacity=30,
        )
    )

    assert response.scene == "xatu-campus"
    assert response.algorithm == "nearest_neighbor"
    assert len(response.routes) >= 1
    assert response.total_distance > 0

    for route_response in response.routes:
        assert all(isinstance(node_id, str) for node_id in route_response.route)
        assert route_response.route[0] == "depot"
        assert route_response.route[-1] == "depot"


def test_custom_route_only_visits_supplied_nodes():
    """
    With exactly two ordered customers, every non-depot node in the
    routes must come from the supplied order list (dorm_1, dorm_5),
    and both must be visited.
    """

    ordered = {"dorm_1", "dorm_5"}

    response = solve_vrp(
        _custom_request(
            [("dorm_1", 5), ("dorm_5", 8)],
            vehicle_count=1,
            capacity=30,
        )
    )

    visited = set()

    for route_response in response.routes:
        for node_id in route_response.route:
            if node_id == "depot":
                continue
            # every visited customer is one of the supplied orders
            assert node_id in ordered
            visited.add(node_id)

    # both ordered customers were served
    assert visited == ordered


def test_custom_order_unknown_node_returns_400():
    """
    An order referencing a node that does not exist in the scene
    must be rejected with HTTP 400.
    """

    try:
        solve_vrp(_custom_request([("abc", 5), ("dorm_1", 8)]))
        raise AssertionError("Expected HTTPException for unknown node")
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "abc" in str(exc.detail)


def test_custom_mode_without_orders_returns_400():
    """
    'custom' mode with an empty / missing orders list -> HTTP 400.
    """

    request = SolveRequest(
        scene="xatu-campus",
        algorithm="nearest_neighbor",
        config=SimulationConfig(mode="custom", vehicle_count=2, capacity=30),
    )

    try:
        solve_vrp(request)
        raise AssertionError("Expected HTTPException for empty custom orders")
    except HTTPException as exc:
        assert exc.status_code == 400


def test_random_mode_still_works():
    """
    Random mode remains functional alongside custom mode.
    """

    request = SolveRequest(
        scene="xatu-campus",
        algorithm="nearest_neighbor",
        config=SimulationConfig(
            mode="random",
            order_count=8,
            vehicle_count=3,
            capacity=30,
            seed=7,
        ),
    )

    response = solve_vrp(request)

    assert response.algorithm == "nearest_neighbor"
    assert len(response.routes) >= 1

    visited = set()
    for route_response in response.routes:
        assert route_response.route[0] == "depot"
        assert route_response.route[-1] == "depot"
        visited.update(
            node_id for node_id in route_response.route if node_id != "depot"
        )

    # 8 orders sampled without replacement -> 8 distinct visited nodes
    assert len(visited) == 8


def test_same_custom_orders_support_repeated_experiments():
    """
    The same order batch can be re-solved with different vehicle
    parameters / algorithms and stays consistent (ordered customers
    are always exactly the supplied ones).
    """

    orders = [("dorm_1", 5), ("dorm_5", 8), ("dorm_9", 6)]
    ordered = {cid for cid, _ in orders}

    run_2_vehicles = solve_vrp(
        _custom_request(orders, vehicle_count=2, capacity=30)
    )
    run_4_vehicles = solve_vrp(
        _custom_request(orders, vehicle_count=4, capacity=30)
    )
    run_savings = solve_vrp(
        _custom_request(orders, algorithm="savings", vehicle_count=2, capacity=30)
    )

    for response in (run_2_vehicles, run_4_vehicles, run_savings):
        visited = set()
        for route_response in response.routes:
            visited.update(
                node_id
                for node_id in route_response.route
                if node_id != "depot"
            )
        assert visited == ordered

    assert run_savings.algorithm == "savings"


if __name__ == "__main__":

    test_custom_orders_solve_successfully()
    test_custom_route_only_visits_supplied_nodes()
    test_custom_order_unknown_node_returns_400()
    test_custom_mode_without_orders_returns_400()
    test_random_mode_still_works()
    test_same_custom_orders_support_repeated_experiments()

    print("ALL CUSTOM ORDER TESTS PASSED")
