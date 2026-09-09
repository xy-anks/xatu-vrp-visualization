from fastapi import HTTPException

from backend.api.solve import solve_vrp
from backend.api.campus import get_campus
from backend.schemas.solve import SolveRequest, SimulationConfig


def _make_request(
    algorithm="nearest_neighbor",
    scene="xatu-campus",
    order_count=10,
    vehicle_count=3,
    capacity=30,
    seed=42,
    mode="random",
):
    return SolveRequest(
        scene=scene,
        algorithm=algorithm,
        config=SimulationConfig(
            mode=mode,
            order_count=order_count,
            vehicle_count=vehicle_count,
            capacity=capacity,
            seed=seed,
        ),
    )


def _all_scene_ids():
    campus = get_campus("xatu-campus")
    ids = {campus["depot"]["id"]}
    ids.update(c["id"] for c in campus["customers"])
    return ids


def test_solve_random_orders_returns_scene_id_routes():
    """
    /solve with random orders succeeds; every route node is a stable
    scene string id, routes start/end at 'depot', and all ordered
    customers are visited exactly once.
    """

    response = solve_vrp(_make_request(order_count=10))

    assert response.scene == "xatu-campus"
    assert response.algorithm == "nearest_neighbor"
    assert len(response.routes) >= 1
    assert response.total_distance > 0

    valid_ids = _all_scene_ids()
    visited = set()

    for route_response in response.routes:
        route = route_response.route

        # route ids are stable scene string ids
        assert all(isinstance(node_id, str) for node_id in route)
        assert all(node_id in valid_ids for node_id in route)

        # every route begins and ends at the depot
        assert route[0] == "depot"
        assert route[-1] == "depot"

        visited.update(node_id for node_id in route if node_id != "depot")

    # 10 orders sampled without replacement from 18 dorms -> 10 visited
    assert len(visited) == 10


def test_vehicle_count_is_adjustable():
    """
    A feasible vehicle fleet solves successfully; an infeasible
    configuration (one tiny vehicle for all orders) is rejected
    with HTTP 400.
    """

    # Generous fleet: feasible
    ok = solve_vrp(
        _make_request(
            order_count=18, vehicle_count=6, capacity=30, seed=1
        )
    )
    assert len(ok.routes) >= 1

    # Single overloaded vehicle: infeasible -> 400
    try:
        solve_vrp(
            _make_request(
                order_count=18, vehicle_count=1, capacity=10, seed=1
            )
        )
        raise AssertionError("Expected HTTPException for infeasible fleet")
    except HTTPException as exc:
        assert exc.status_code == 400


def test_seed_reproducibility_through_api():
    """
    Same seed + same parameters must yield identical routes.
    """

    run_a = solve_vrp(_make_request(order_count=12, seed=2024))
    run_b = solve_vrp(_make_request(order_count=12, seed=2024))
    run_c = solve_vrp(_make_request(order_count=12, seed=9999))

    routes_a = [r.route for r in run_a.routes]
    routes_b = [r.route for r in run_b.routes]
    routes_c = [r.route for r in run_c.routes]

    assert routes_a == routes_b
    assert routes_a != routes_c


def test_savings_algorithm_returns_scene_ids():
    """
    The savings solver works through the same pipeline and also
    returns scene string ids.
    """

    response = solve_vrp(
        _make_request(algorithm="savings", order_count=8, seed=5)
    )

    assert response.algorithm == "savings"

    valid_ids = _all_scene_ids()

    for route_response in response.routes:
        assert all(
            isinstance(node_id, str) and node_id in valid_ids
            for node_id in route_response.route
        )
        assert route_response.route[0] == "depot"
        assert route_response.route[-1] == "depot"


def test_bad_scene_and_bad_algorithm_return_400():
    """
    Unknown scene id and unknown algorithm name must raise HTTP 400.
    """

    try:
        solve_vrp(_make_request(scene="not-a-scene"))
        raise AssertionError("Expected HTTPException for unknown scene")
    except HTTPException as exc:
        assert exc.status_code == 400

    try:
        solve_vrp(_make_request(algorithm="not-an-algorithm"))
        raise AssertionError("Expected HTTPException for unknown algorithm")
    except HTTPException as exc:
        assert exc.status_code == 400


def test_config_validation_rejects_bad_params():
    """
    Pydantic rejects invalid simulation config (non-positive counts)
    before the endpoint logic runs.
    """

    from pydantic import ValidationError

    try:
        SolveRequest(
            scene="xatu-campus",
            algorithm="nearest_neighbor",
            config=SimulationConfig(order_count=0),
        )
        raise AssertionError("Expected ValidationError for order_count=0")
    except ValidationError:
        pass


if __name__ == "__main__":

    test_solve_random_orders_returns_scene_id_routes()
    test_vehicle_count_is_adjustable()
    test_seed_reproducibility_through_api()
    test_savings_algorithm_returns_scene_ids()
    test_bad_scene_and_bad_algorithm_return_400()
    test_config_validation_rejects_bad_params()

    print("ALL SOLVE API TESTS PASSED")
