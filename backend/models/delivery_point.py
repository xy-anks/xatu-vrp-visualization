class DeliveryPoint:
    """
    Represents a campus delivery location.
    """
    def __init__(
            self,
            id:int,
            name:str,
            latitude:float,
            longitude:float,
            demand:int
    ):
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.demand = demand
