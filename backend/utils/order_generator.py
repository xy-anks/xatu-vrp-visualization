import random

from backend.models.order import Order


# Node types that can receive delivery orders
# (xatu-campus: dorm 宿舍 / real-world: store 门店)
ORDERABLE_NODE_TYPES = ("dorm", "store")


def _eligible_customers(scene):
    """
    Return scene customer nodes that can receive orders
    (nodes whose type is in ORDERABLE_NODE_TYPES).
    """
    return [
        customer
        for customer in scene.customers
        if customer.type in ORDERABLE_NODE_TYPES
    ]


def _generate_random_orders(scene, order_count, demand_range, seed):
    """
    Generate orders in 'random' mode.

    - Selects orderable nodes (type in ORDERABLE_NODE_TYPES).
    - When order_count <= number of eligible nodes, samples nodes
      without replacement (one order per node).
    - When order_count exceeds the number of eligible nodes, samples
      with replacement (multiple orders may target the same node;
      their demands are meant to be aggregated at problem build time).
    - Each order demand is a random integer within demand_range (inclusive).
    - A local random.Random(seed) instance is used so results are
      reproducible and the global random state is untouched.
    """

    low, high = demand_range

    eligible = _eligible_customers(scene)

    if not eligible:
        raise ValueError(
            f"Scene '{scene.scene_id}' has no orderable nodes "
            f"(types {ORDERABLE_NODE_TYPES})"
        )

    if not isinstance(order_count, int) or order_count < 1:
        raise ValueError(
            f"order_count must be a positive integer, got {order_count!r}"
        )

    rng = random.Random(seed)

    if order_count <= len(eligible):
        chosen_nodes = rng.sample(eligible, order_count)
    else:
        chosen_nodes = [
            rng.choice(eligible)
            for _ in range(order_count)
        ]

    orders = []

    for order_id, node in enumerate(chosen_nodes):
        demand = rng.randint(low, high)

        orders.append(
            Order(
                order_id=order_id,
                customer_id=node.id,
                demand=demand
            )
        )

    return orders


def generate_orders(
    scene,
    mode="random",
    order_count=None,
    demand_range=(1, 10),
    seed=None
):
    """
    Generate a list of Order objects for one simulation (Order Layer).

    Args:
        scene:        a SceneMap (static world description)
        mode:         order generation mode.
                      Currently supported: "random".
        order_count:  exact number of orders to generate (random mode)
        demand_range: (min_demand, max_demand) inclusive, random mode
        seed:         random seed for reproducible generation

    Returns:
        list[Order]; len(result) == order_count in random mode.

    Raises:
        ValueError: unsupported mode, invalid order_count / demand_range,
                    or scene without orderable nodes.
    """

    if mode == "random":

        if order_count is None:
            raise ValueError(
                "order_count is required in 'random' mode"
            )

        low, high = demand_range

        if (
            not isinstance(low, int)
            or not isinstance(high, int)
            or low < 1
            or high < low
        ):
            raise ValueError(
                f"demand_range must be (min, max) positive integers "
                f"with min <= max, got {demand_range!r}"
            )

        return _generate_random_orders(
            scene,
            order_count=order_count,
            demand_range=demand_range,
            seed=seed
        )

    raise ValueError(
        f"Unsupported order generation mode: '{mode}'. "
        f"Supported modes: ['random']"
    )
