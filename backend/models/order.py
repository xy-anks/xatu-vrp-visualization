class Order:
    """
    A single delivery order (Order Layer).

    An order is a dynamic simulation parameter: it does NOT belong to
    the static scene and is never stored in a scene json file.

    Attributes:
        order_id:    unique id of this order within one simulation
        customer_id: stable scene node id the order ships to
                     (must reference a MapNode id in the SceneMap)
        demand:      delivery quantity of this order
    """

    def __init__(
        self,
        order_id,
        customer_id,
        demand
    ):
        self.order_id = order_id
        self.customer_id = customer_id
        self.demand = demand

    def __repr__(self):
        return (
            f"Order(order_id={self.order_id!r}, "
            f"customer_id={self.customer_id!r}, "
            f"demand={self.demand!r})"
        )
