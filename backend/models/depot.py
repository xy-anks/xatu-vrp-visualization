class Depot:
    """
    Depot represents the starting and ending point
    of vehicles in VRP.
    """

    def __init__(
        self,
        id,
        name,
        latitude,
        longitude
    ):
        self.id = id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude