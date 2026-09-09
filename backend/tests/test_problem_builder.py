from backend.models.order import Order
from backend.utils.scene_loader import load_scene
from backend.utils.order_generator import generate_orders
from backend.utils.problem_builder import build_problem
from backend.solver.solver_registry import get_solver


def test_single_order():
    """
    One order -> one customer with solver id 1, depot id 0,
    and a 2x2 distance matrix.
    """

    scene = load_scene("xatu-campus")
    orders = [Order(order_id=0, customer_id="dorm_1", demand=5)]

    problem, mapping = build_problem(
        scene, orders,
        vehicle_count=2, vehicle_capacity=30
    )

    # Mapping
    assert mapping == {0: "depot", 1: "dorm_1"}

    # Depot
    assert problem.depot.id == 0

    # Customers
    assert len(problem.customers) == 1
    customer = problem.customers[0]
    assert customer.id == 1
    assert customer.name == "1公寓"
    assert customer.demand == 5

    # Vehicles
    assert len(problem.vehicles) == 2
    assert all(v.capacity == 30 for v in problem.vehicles)

    # Distance matrix indexed by solver ids 0..1
    assert len(problem.distance_matrix) == 2
    assert len(problem.distance_matrix[0]) == 2
    assert problem.distance_matrix[0][0] == 0
    assert problem.distance_matrix[0][1] == problem.distance_matrix[1][0]
    assert problem.distance_matrix[0][1] > 0


def test_multiple_orders_same_customer_aggregate():
    """
    Two orders to the same customer_id must merge into one customer
    whose demand is the sum.
    """

    scene = load_scene("xatu-campus")
    orders = [
        Order(order_id=0, customer_id="dorm_2", demand=4),
        Order(order_id=1, customer_id="dorm_2", demand=7),
    ]

    problem, mapping = build_problem(
        scene, orders,
        vehicle_count=1, vehicle_capacity=30
    )

    assert len(problem.customers) == 1
    assert problem.customers[0].id == 1
    assert problem.customers[0].demand == 11
    assert mapping == {0: "depot", 1: "dorm_2"}


def test_multiple_customers_continuous_ids():
    """
    Orders to distinct customers get continuous solver ids 1..m
    in deterministic scene order, and the matrix covers 0..m.
    """

    scene = load_scene("xatu-campus")
    orders = [
        Order(order_id=0, customer_id="dorm_9", demand=3),
        Order(order_id=1, customer_id="dorm_1", demand=3),
        Order(order_id=2, customer_id="dorm_shuang", demand=3),
        Order(order_id=3, customer_id="dorm_9", demand=2),  # aggregate
    ]

    problem, mapping = build_problem(
        scene, orders,
        vehicle_count=3, vehicle_capacity=20
    )

    # 3 distinct customers + depot
    assert len(problem.customers) == 3

    solver_ids = [customer.id for customer in problem.customers]
    assert solver_ids == [1, 2, 3]

    # Demands: dorm_1=3, dorm_9=3+2=5, dorm_shuang=3
    demand_by_solver_id = {
        customer.id: customer.demand
        for customer in problem.customers
    }
    scene_id_by_solver_id = mapping

    assert demand_by_solver_id[
        _solver_id_for(scene_id_by_solver_id, "dorm_1")
    ] == 3
    assert demand_by_solver_id[
        _solver_id_for(scene_id_by_solver_id, "dorm_9")
    ] == 5
    assert demand_by_solver_id[
        _solver_id_for(scene_id_by_solver_id, "dorm_shuang")
    ] == 3

    # Mapping covers all indices present in the matrix
    assert set(mapping.keys()) == {0, 1, 2, 3}
    assert mapping[0] == "depot"
    assert len(problem.distance_matrix) == 4


def test_nearest_neighbor_runs_on_built_problem():
    """
    The built problem must be directly solvable by the unchanged
    nearest_neighbor solver, and every route index must translate
    back to a scene id via the mapping.
    """

    scene = load_scene("xatu-campus")
    orders = generate_orders(
        scene, mode="random",
        order_count=8, demand_range=(2, 8),
        seed=2024
    )

    problem, mapping = build_problem(
        scene, orders,
        vehicle_count=3, vehicle_capacity=20
    )

    solver = get_solver("nearest_neighbor")
    result = solver.solve(problem)

    assert result is not None
    assert len(result.routes) >= 1

    ordered_scene_ids = set()

    for route in result.routes:
        # Every route starts and ends at the depot (solver id 0)
        assert route[0] == 0
        assert route[-1] == 0

        for solver_id in route:
            # Every solver index must be translatable to a scene id
            assert solver_id in mapping
            if solver_id != 0:
                ordered_scene_ids.add(mapping[solver_id])

    # All distinct ordered customers must be visited exactly once
    expected_scene_ids = {
        order.customer_id for order in orders
    }
    assert ordered_scene_ids == expected_scene_ids

    # Translated routes contain only stable scene string ids
    for route in result.routes:
        translated = [mapping[solver_id] for solver_id in route]
        assert translated[0] == scene.depot.id
        assert all(isinstance(node_id, str) for node_id in translated)

    assert result.total_distance > 0


def test_invalid_inputs_raise():
    """
    Empty orders, bad vehicle parameters and unknown customer ids
    must raise ValueError.
    """

    scene = load_scene("xatu-campus")

    cases = [
        ([], 1, 10),
        ([Order(0, "dorm_1", 5)], 0, 10),
        ([Order(0, "dorm_1", 5)], 1, 0),
        ([Order(0, "not_a_node", 5)], 1, 10),
        ([Order(0, "depot", 5)], 1, 10),
    ]

    for orders, v_count, v_cap in cases:
        try:
            build_problem(scene, orders, v_count, v_cap)
            raise AssertionError(
                f"Expected ValueError for {(orders, v_count, v_cap)}"
            )
        except ValueError:
            pass


def _solver_id_for(mapping, scene_id):
    """Helper: reverse-lookup solver id for a scene id."""
    for solver_id, sid in mapping.items():
        if sid == scene_id:
            return solver_id
    raise KeyError(scene_id)


if __name__ == "__main__":

    test_single_order()
    test_multiple_orders_same_customer_aggregate()
    test_multiple_customers_continuous_ids()
    test_nearest_neighbor_runs_on_built_problem()
    test_invalid_inputs_raise()

    print("ALL PROBLEM BUILDER TESTS PASSED")
