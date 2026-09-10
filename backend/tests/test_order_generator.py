from backend.utils.scene_loader import load_scene
from backend.utils.order_generator import generate_orders
from backend.models.order import Order


def _signature(orders):
    """
    Comparable signature of an order list:
    (order_id, customer_id, demand) tuples in order.
    """
    return [
        (order.order_id, order.customer_id, order.demand)
        for order in orders
    ]


def test_generates_exact_count():
    """
    random mode must generate exactly order_count orders,
    with sequential order_ids starting at 0.
    """

    scene = load_scene("xatu-campus")

    orders = generate_orders(
        scene,
        mode="random",
        order_count=10,
        seed=42
    )

    assert len(orders) == 10

    assert [order.order_id for order in orders] == list(range(10))

    for order in orders:
        assert isinstance(order, Order)


def test_customer_ids_come_from_scene():
    """
    Every order.customer_id must reference an orderable node
    (type == 'dorm') that exists in the SceneMap.
    """

    scene = load_scene("xatu-campus")

    orderable_ids = {
        customer.id
        for customer in scene.customers
        if customer.type == "dorm"
    }

    orders = generate_orders(
        scene,
        mode="random",
        order_count=15,
        seed=7
    )

    for order in orders:
        assert order.customer_id in orderable_ids
        # node must actually be resolvable in the scene
        scene.node_by_id(order.customer_id)


def test_demand_within_range():
    """
    All demands must lie inside the requested demand_range (inclusive).
    """

    scene = load_scene("xatu-campus")

    orders = generate_orders(
        scene,
        mode="random",
        order_count=20,
        demand_range=(5, 12),
        seed=1
    )

    for order in orders:
        assert 5 <= order.demand <= 12


def test_seed_reproducibility():
    """
    Same seed + same parameters must produce identical orders;
    different seeds should produce different results.
    """

    scene = load_scene("xatu-campus")

    run_a = generate_orders(scene, order_count=12, seed=123)
    run_b = generate_orders(scene, order_count=12, seed=123)
    run_c = generate_orders(scene, order_count=12, seed=999)

    assert _signature(run_a) == _signature(run_b)
    assert _signature(run_a) != _signature(run_c)


def test_count_exceeds_nodes_allows_duplicates():
    """
    When order_count > number of orderable nodes, generation still
    returns exactly order_count orders (same node may receive several
    orders; demands aggregate later at problem build time).
    """

    scene = load_scene("xatu-campus")

    dorm_count = sum(
        1 for customer in scene.customers
        if customer.type == "dorm"
    )

    orders = generate_orders(
        scene,
        mode="random",
        order_count=dorm_count + 5,
        seed=3
    )

    assert len(orders) == dorm_count + 5

    orderable_ids = {
        customer.id
        for customer in scene.customers
        if customer.type == "dorm"
    }

    for order in orders:
        assert order.customer_id in orderable_ids


def test_invalid_arguments_raise():
    """
    Unknown mode, non-positive order_count and bad demand_range
    must raise ValueError.
    """

    scene = load_scene("xatu-campus")

    for bad_kwargs in (
        {"mode": "custom", "order_count": 5},
        {"order_count": 0},
        {"order_count": -3},
        {"order_count": 5, "demand_range": (0, 10)},
        {"order_count": 5, "demand_range": (8, 3)},
    ):
        try:
            generate_orders(scene, seed=1, **bad_kwargs)
            raise AssertionError(
                f"Expected ValueError for {bad_kwargs}"
            )
        except ValueError:
            pass


if __name__ == "__main__":

    test_generates_exact_count()
    test_customer_ids_come_from_scene()
    test_demand_within_range()
    test_seed_reproducibility()
    test_count_exceeds_nodes_allows_duplicates()
    test_invalid_arguments_raise()

    scene = load_scene("xatu-campus")
    orders = generate_orders(scene, order_count=10, seed=42)

    print("Generated orders (seed=42, count=10):")
    for order in orders:
        print(
            order.order_id,
            order.customer_id,
            scene.node_by_id(order.customer_id).name,
            "demand =",
            order.demand
        )

    print("\nALL ORDER GENERATOR TESTS PASSED")
