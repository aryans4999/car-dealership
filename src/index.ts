import express from "express";
import { Principal, Server, nat,StableBTreeMap, ic,nat16,nat64,Opt } from "azle";
import { v4 as uuidv4 } from 'uuid';

// TODO: creating classes for cars, staff, and owner
class Car {
    id!: string;
    name!: string;
    brand!: string;
    type!: string;
    price!: string;
}

class Staffs{
    username!: string;
    name!: string;
    has_write_permission!: boolean;
}

class Owner {
    username!: string;
    password!: string;
}

const owners = StableBTreeMap<string, Owner>(2);
const carStorage = StableBTreeMap<string, Car>(0);
const staffs = StableBTreeMap<string, Staffs>(1);

// TODO: creating a authenticator to distinguish between staff and owner
function authenticateOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
    const username = req.headers["username"] as string;
    const password = req.headers["password"] as string;

    const ownerOpt = owners.get(username);

    if ("None" in ownerOpt || ownerOpt.Some.password !== password) {
        res.status(401).send("Unauthorized");
    } else {
        next();
    }
}


// TODO: creating the backend functions managing cars and staff 
export default Server(() =>  {
    const app = express();
    app.use(express.json());
    app.post("/buy", (req, res) => {
        const car: Car = { id: uuidv4(), ...req.body };
        carStorage.insert(car.id, car);
        res.json(car);
    });

    // * Function for listing all the cars
    app.get("/cars", (req, res) => {
        res.json(carStorage.values());
    });

    // * Function for finding the cars using id
    app.get("/car/:id", (req, res) => {
        const carId = req.params.id;
        const carOpt = carStorage.get(carId);
        if ("None" in carOpt) {
            res.status(404).send(`the car with id=${carId} not found`);
        } else {
            res.json(carOpt.Some);
        }
    });

    // * Function for finding and updating car details using id
    app.put("/car/:id", (req, res) => {
        const carId = req.params.id;
        const updatedCarData = req.body;
        const carOpt = carStorage.get(carId);
        if ("None" in carOpt) {
            res.status(404).send(`The car with id=${carId} not found`);
        } else {
            const existingCar = carOpt.Some;
            const updatedCar = { ...existingCar, ...updatedCarData };
            carStorage.insert(carId, updatedCar);
            res.json(updatedCar);
        }
    });

    // * Function for selling the cars
    app.delete("/sell/:id", (req, res) => {
        const carId = req.params.id;
        const carOpt = carStorage.get(carId);
        if ("None" in carOpt) {
            res.status(404).send(`The car with id=${carId} not found`);
        } else {
            carStorage.remove(carId);
            res.json({ message: `Car with id=${carId} sold successfully` });
        }
    });  

    // * Function for adding staff with owner authentication
    app.post("/addStaff", authenticateOwner, (req, res) => {
        const staff: Staffs = { id: { username: req.body.username }, ...req.body };
        staffs.insert(staff.username, staff);
        res.json(staff);
    });

    // * Function for removing staff with owner authentication
    app.delete("/removeStaff/:username", authenticateOwner, (req, res) => {
        const staffUsername = req.params.username;
        const staffOpt = staffs.get(staffUsername);

        if ("None" in staffOpt) {
            res.status(404).send(`The staff with username=${staffUsername} not found`);
        } else {
            staffs.remove(staffUsername);
            res.json({ message: `Staff with username=${staffUsername} removed successfully` });
        }
    });

    return app.listen();
});