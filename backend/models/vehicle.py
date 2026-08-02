class Vehicle:
    """
    Represents a campus delivery vehicle.
    """
    def __init__(
        self,
        id: int,
        capacity: int,
        speed: float
    ):
        self.id = id
        self.capacity = capacity
        self.speed = speed