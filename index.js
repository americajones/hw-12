const express = require("express");
const inquirer = require("inquirer");
const mysql = require("mysql");
const ctable = require("console.table");

const app = express();

var PORT = process.env.PORT || 8080;
let departArr = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// app.engine("handlebars", exphbs({ defaultLayout: "main" }));
// app.set("view engine", "handlebars");

var connection = mysql.createConnection({
    host: "localhost",
  port: 3306,
  user: "root",
  password: "fabulous!",
  database: "employee_db"
});

connection.connect(function(err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;}
        console.log("connected as id " + connection.threadId);
        inquire();
    });
    
    app.listen(PORT, function() {
        console.log("Server listening on: http://localhost:" + PORT);
    });
    
function inquire() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "whatDo",
            choices: ["Add department", "Add role", "Add employee", "View employees", "Update employee roles", "Quit"]
        }
    ]).then(function(data) {
        if (data.whatDo === "Add department") {
            inquirer.prompt([
                 {
                name: "depName",
             message: "Name of new department?",
             type: "input" 
        }
            ]).then(function(input) {
                addDepart(input.depName);
                inquire();
            })
        }
        if (data.whatDo === "Add role") {
            returnDep();
            console.log("dept arr is ", departArr);
            
            inquirer.prompt([
                 {
                name: "title",
             message: "Name of new role?",
             type: "input" 
        },
                 {
                name: "salary",
             message: "Wages for new role?",
             type: "number" 
        },
                 {
                name: "department",
             message: "Department?",
             type: "list",
             choices: departArr
        }
            ]).then(function(input) {
                let deptId = returnDepId(input.department)
                addRole(input.title, input.salary, deptId);
                inquire();
            })
        }
        if (data.whatDo === "Add employee") {

            let managerList = [];
            returnManagerList();
            console.log("manager list is: ", managerList)
            let roleArr = [];

            inquirer.prompt([
                {
                    name: "first",
                    message: "Employee's first name?",
                    type: "input",
                },
                {
                    name: "last",
                    message: "Employee's last name?",
                    type: "input",
                },
                {
                    name: "role",
                    message: "What is employee's role?",
                    type: "list",
                    choices: roleArr
                },
                {
                    name: "manager",
                    message: "Who manages the new employee?",
                    type: "list",
                    choices: managerList
                }
        
            ]).then((answer) => {
                let role = answer.role;
                let manager = answer.manager;
                if (manager != null) {
                    role = parseInt(role.charAt(0));
                    manager = parseInt(manager.charAt(0));
                } else {
                    manager = null;
                    role = parseInt(role.charAt(0));
                }
                
              addEmployee(answer.first, answer.last, role, manager)
            })

        }

        if (data.whatDo === "View employees") {
            viewEmployees();
            inquire()
        }
    
        if (data.whatDo === "Quit") {
            console.log("Goodbye!");
            connection.end();
        
        }
    })
}
// add departments, roles, employees
function addDepart(chosenName) {
    connection.query("INSERT INTO department SET ?",
    {
        name: chosenName,
    },
    (err, res) => {
        if (err) throw err;
        console.log("\nDepartment Added!\n")
    })
}
function addRole(t, s, d) {
    connection.query("INSERT INTO role SET ?",
    {
        title: t,
        salary: s,
        department_id: d 
    },
    (err, res) => {
        if (err) throw err;
        console.log("\nRole Added!\n")
    })
}
function addEmployee(f, l, r, m) {
    connection.query("INSERT INTO employee SET ?",
    {  first_name: f,
        last_name: l,
        role_id: r,
        manager_id: m,
   },
    (err, res) => {
        if (err) throw err;
        console.log("Employee Added!\n")
    })
};

async function returnDep() {
    connection.query("SELECT name FROM department GROUP BY name",
    (err, res) => {
        if(err) throw err;
        departArr = JSON.stringify(res);
    })
}
function returnRole() {
    connection.query("SELECT name FROM role GROUP BY name",
    (err, res) => {
        if(err) throw err;
        roleArr = JSON.stringify(res);
    })
}
function returnDepId(dept) {
    connection.query("SELECT id FROM department WHERE name = '?'", [dept],
                (err, res) => {
                    if(err) throw err;
                    return res;
                })
}

function returnManagerList() {
    connection.query("SELECT name FROM employee WHERE manager_id = NOT NULL", 
    (err, res) => {
        if (err) throw err;
        managerList = JSON.stringify(res)
    })
}

function viewEmployees() {

    connection.query("SELECT * FROM employees", (err, res) => {
        if (err) throw err;
        ctable(res)
    })

};

function updateArr() {
connection.query("SELECT name FROM department GROUP BY name",
(err, res) => {
    if(err) throw err;
    // console.log(res);
    console.log(JSON.stringify(res));
    departArr = JSON.stringify(res);
    // departArr =
    // console.log("new arr= ", arr.map(res));
    //  departArr = res.map(obj => {
    //     let newArr = [];
    //     newArr.push(obj.name);
    //     return newArr;
    // });
    // res.forEach(result => departArr.push(result))
});
}
// function updateRoles();

//bonus:
//function updateEmployManag()
//function veiwByManager()
//function deleteCategory()
// function veiwCombiSalariByDepart()

