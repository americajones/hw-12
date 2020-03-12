const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "fabulous!",
    database: "employee_db"
})

connection.connect(function (err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;
    }
    console.log(`connected as id ${connection.threadId}`);
    start();

});


const start = () => {

    inquirer.prompt({
        name: "menu",
        type: "list",
        message: "What would you like to do?",
        choices:
            [
                "View All Employees", "View Employees By Department", "View Employees By Role",
                "View Employees by Manager", "Add Employee", "Remove Employee", "Update Employee",
                "View All Roles", "Add Role", "Remove Role",
                "View All Departments", "Add Department", "Remove Department"
            ]
    }).then((choice) => {
        // console.table(choice);
        if (choice.menu === "View All Employees") allEmployees();
        if (choice.menu === "View Employees By Department") allEmpByDept();
        if (choice.menu === "View Employees By Role") allEmpByRole();
        if (choice.menu === "View Employees by Manager") allEmpByMan();
        if (choice.menu === "Add Employee") addEmp();
        if (choice.menu === "Remove Employee") deleteEmp();
        if (choice.menu === "Update Employee") updateEmp();
        if (choice.menu === "View All Roles") allRoles();
        if (choice.menu === "Add Role") addRole();
        if (choice.menu === "Remove Role") deleteRole();
        if (choice.menu === "View All Departments") allDep();
        if (choice.menu === "Add Department") addDep();
        if (choice.menu === "Remove Department") deleteDep();

    })
}
// these don't work all the time and it's probably an async issue but I couldn't figure out how to get async/await to work here
const roleArr = (res) => {

    const roles = [];
    res.map(obj => {
        let newObj = {
            name: obj.id + ". " + obj.title,
            value: {
                id: obj.id,
                title: obj.title,
                salary: obj.salary,
                department_id: obj.department_id
            }
        }
        roles.push(newObj)
    })
    return roles;
}

const managerArr = (res) => {

    const managers = [];
    res.map(obj => {
        let newObj = {
            name: obj.id + ". " + obj.first_name + " " + obj.last_name,
            value: {
                id: obj.id,
                first_name: obj.title,
                last_name: obj.salary
            }
        }
        managers.push(newObj)
    })
    return managers;
}

const empArr = (res) => {
    const employees = [];
    res.map(obj => {
        let newObj = {
            name: obj.id + ". " + obj.first_name + " " + obj.last_name,
            value: {
                id: obj.id,
                first_name: obj.first_name,
                last_name: obj.last_name,
                role_id: obj.role_id,
                managers_id: obj.manager_id
            }
        };
        employees.push(newObj)
    })
    return employees;

}

let depArr = (res) => {
    const departments = [];
    res.map(obj => {
        let newObj = {
            name: obj.name,
            value: {
                id: obj.id,
                name: obj.name
            }
        }
        departments.push(newObj)
    })
    return departments;
}

const allEmployees = () => {
    // this is where we show all the employees by querying the mySQL database
    connection.query(`
    SELECT 
    e.id, e.first_name AS 'first name', e.last_name AS 'last name', r.title AS 'position', r.salary, CONCAT(m.first_name, " ", m.last_name) AS 'manager name'
    FROM employee e
    LEFT JOIN employee m
    ON m.id = e.manager_id
    INNER JOIN role r
    ON r.id = e.role_id
    JOIN department d
    ON r.department_id = d.id;`, (err, res) => {
        consoleResult(err, res);
    });
}

const allEmpByDept = () => {
    // this is where we sort employees by their departments

    connection.query(`SELECT * FROM department;`, (err, res) => {
        if (err) throw err;
        //  const depts = res;
        //  console.log(depts)

        const departmentArr = depArr(res);
        // consoleResult(err, res);
        inquirer.prompt({
            name: "department",
            type: "list",
            message: "Which department would you like to view?",
            choices: departmentArr
        }).then(answer => {
            //  console.log(answer.department.name)
            connection.query(`
                SELECT e.id, e.first_name, e.last_name, d.name
                FROM employee e
                JOIN department d
                JOIN role r
                ON e.role_id = r.id AND r.department_id = d.id
                WHERE d.name= ? ;
            `, [answer.department.name], (err, res) => {
                consoleResult(err, res)
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })
    });
}




const allEmpByRole = () => {
    // this is where we filter employees by their role
    connection.query(`SELECT * FROM role;`, (err, res) => {
        if (err) throw err;
        // roleArr(res);
        const rolesArr = roleArr(res);
        consoleResult(err, res);
        inquirer.prompt({
            name: "role",
            type: "list",
            message: "Which role would you like to view?",
            choices: rolesArr
        }).then(answer => {
            console.log(answer.role.title)
            connection.query(`
                SELECT e.id, e.first_name, e.last_name, r.title
                FROM employee e
                JOIN role r
                ON e.role_id = r.id
                WHERE r.title= ? ;
            `, [answer.role.title], (err, res) => {
                consoleResult(err, res)
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })
    });
}

const allEmpByMan = () => {
    // this is where we filter by manager
    connection.query(`
    SELECT DISTINCT m.id, m.first_name, m.last_name
    FROM employee e
    JOIN employee m
    ON e.manager_id = m.id;
    `, (err, res) => {
        if (err) throw err;
        const managersArr = managerArr(res)
        inquirer.prompt({
            name: "manager",
            type: "list",
            message: "Which manager's employees would you like to view?",
            choices: managersArr
        }).then(answer => {
            // console.log(answer.manager.id)
            connection.query(`
               SELECT e.id, e.first_name, e.last_name
                FROM employee e
                JOIN employee m
                ON e.manager_id = m.id
                WHERE m.id=?;
            `, [answer.manager.id], (err, res) => {
                // console.log(res);
                consoleResult(err, res)
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })
    });
}



const addEmp = () => {
    // const toPush = result.id + ". " + result.first_name + " " + result.last_name;
    connection.query(`
    SELECT DISTINCT m.id, m.first_name, m.last_name
    FROM employee e
    JOIN employee m
    ON e.manager_id = m.id
    JOIN role r
    ON m.role_id = r.id
    `, (err, res) => {
        if (err) throw err;
        const managersArr = managerArr(res);
        managersArr.push({ name: "0. None" });

        connection.query(`SELECT * FROM role`, (err, res) => {
            if (err) throw err;
            const rolesArr = roleArr(res);
            inquirer.prompt([
                {
                    name: "first",
                    type: "input",
                    message: "Enter employee's first name:",
                    validate: validator
                },
                {
                    name: "last",
                    type: "input",
                    message: "Enter employee's last name:",
                    validate: validator
                },
                {
                    name: "role",
                    type: "list",
                    message: "What is their role in the company?",
                    choices: rolesArr
                },
                {
                    name: "manager",
                    type: "list",
                    message: "Who manages new employee?",
                    choices: managersArr
                },
            ]).then((answer) => {
                // console.log(answer.manager)
                const newEmployee = {
                    first_name: answer.first,
                    last_name: answer.last,
                    role_id: answer.role.id,
                    manager_id: answer.manager.id
                }

                // console.table(newEmployee)
                // if (role === "")
                connection.query(`INSERT INTO employee SET ? `, newEmployee, (err, res) => {
                    if (err) throw err;
                    // console.log(res)
                    allEmployees();
                })
            }).catch((error) => {
                console.log(error.message);
                res.json({ error: error.message });
            })
        })
    })
}

const deleteEmp = () => {
    // this is where we delete employees/roles/departments
    connection.query("SELECT * FROM employee", (err, res) => {
        if (err) throw err;
        const employeeArr = empArr(res);

        inquirer.prompt({
            name: "employee",
            type: "list",
            message: "Which employee would you like to delete?",
            choices: employeeArr
        }).then((answer) => {
            // console.log(answer.employee.id);
            connection.query(`DELETE FROM employee WHERE id=?`, [answer.employee.id], (err, res) => {
                if (err) throw err;
                allEmployees();
            })
        }).catch((error) => {
            console.log(error.message);
            // res.json({ error: error.message });
        });
    })
}

const updateEmp = () => {
    connection.query(`SELECT * FROM employee`, (err, res) => {
        if (err) throw err;
        const employeeArr = empArr(res);

        inquirer.prompt([
            {
                name: "employee",
                type: "list",
                message: "Which employee would you like to update?",
                choices: employeeArr
            },
            {
                name: "update",
                type: "list",
                message: "What would you like to update?",
                choices: ["Name", "Role", "Manager"]
            }
        ]).then(answer => {
            const empId = answer.employee.id
            if (answer.update === "Name") {
                inquirer.prompt([
                    {
                        name: "firstName",
                        type: "input",
                        message: "Update employee first name"
                    },
                    {
                        name: "lastName",
                        type: "input",
                        message: "Update employee last name"
                    }
                ]).then(answer2 => {
                    console.log(empId);
                    console.log(answer2.firstName + " " + answer2.lastName)

                    const newEmpName = {
                        first_name: answer2.firstName,
                        last_name: answer2.lastName
                    }
                    connection.query(`
                    UPDATE employee
                    SET ?
                    WHERE id =?`, [newEmpName, empId], (err, res) => {
                        if (err) throw err;
                        console.log("Employee Name Successfully Updated!")
                        allEmployees();
                    })
                }).catch((error) => {
                    console.log(error.message);
                    res.json({ error: error.message });
                })
            }
            if (answer.update === "Role") {
                connection.query(`SELECT * FROM role`, (err, res) => {
                    if (err) throw err;
                    const rolesArr = roleArr(res);

                    inquirer.prompt({
                        name: "newRole",
                        type: "list",
                        message: "Choose a new role",
                        choices: rolesArr
                    }).then(answer2 => {
                        connection.query(`
                    UPDATE employee SET role_id=?
                    WHERE id=?
                    `, [answer2.newRole.id, empId], (err, res) => {
                            if (err) throw err;
                            // console.log(res)
                            allEmployees();
                        })
                    }).catch((error) => {
                        console.log(error.message);
                        res.json({ error: error.message });
                    })
                })

            }
            if (answer.update === "Manager") {
                connection.query(`
                SELECT DISTINCT m.id, m.first_name, m.last_name
                FROM employee e
                JOIN employee m
                ON e.manager_id = m.id;`, (err, res) => {

                    if (err) throw err;
                    const managersArr = managerArr(res);

                    inquirer.prompt({
                        name: "newManager",
                        type: "list",
                        message: "Choose a new manager",
                        choices: managersArr
                    }).then(answer2 => {
                        connection.query(`
                UPDATE employee SET manager_id=?
                WHERE id=?
                `, [answer2.newManager.id, empId], (err, res) => {
                            if (err) throw err;
                            // console.log(res)
                            allEmployees();
                        })
                    }).catch((error) => {
                        console.log(error.message);
                        res.json({ error: error.message });
                    })
                })
            }
        })
    })
}

const allRoles = () => {
    connection.query(`
    SELECT id, title, salary FROM role
    `, (err, res) => {
        if (err) throw err;
        consoleResult(err, res)
    })
}

const allDep = () => {
    connection.query(`
    SELECT id, name FROM department
    `, (err, res) => {
        if (err) throw err;
        consoleResult(err, res)
    })
}

const addRole = () => {
    connection.query(`
    SELECT * FROM department
    `, (err, res) => {
        if (err) throw err;
        const departmentArr = depArr(res);
        inquirer.prompt([
            {
                name: "newRole",
                type: "input",
                message: "What is the new role called?"
            },
            {
                name: "newSal",
                type: "input",
                message: "Salary for new role"
            },
            {
                name: "newDept",
                type: "list",
                message: "What department does this role belong in?",
                choices: departmentArr
            }
        ]).then(answer => {

            const newRole = {
                title: answer.newRole,
                salary: answer.newSal,
                department_id: answer.newDept.id
            }

            connection.query(`
                INSERT INTO role SET ?
                `, newRole, (err, res) => {
                if (err) throw err;
                // console.log(res)
                allEmployees();
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })
    })
}



const deleteRole = () => {
    // delete a role from the role table
    connection.query(`
    SELECT * FROM role;
    `, (err, res) => {
        if (err) throw err;
        const rolesArr = roleArr(res);
        inquirer.prompt({
            name: "deleteRole",
            type: "list",
            message: "Delete which role?",
            choices: rolesArr
        }).then(answer => {
            // console.log(answer.deleteRole.id);
            connection.query(`
                DELETE FROM role WHERE id=? 
                `, [answer.deleteRole.id], (err, res) => {
                if (err) throw err;
                console.log(res);
                allEmployees();
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })
    })
}

const addDep = () => {
    inquirer.prompt({
        name: "newDep",
        type: "input",
        message: "New department name"
    }).then(answer => {
        connection.query(`INSERT INTO department SET name=?`, [answer.newDep], (err, res) => {
            if (err) throw err;
            // console.log(res)
            allEmployees();
        })
    }).catch((error) => {
        console.log(error.message);
        res.json({ error: error.message });
    })

}

const deleteDep = () => {
    connection.query(`
    SELECT * FROM department;
    `, (err, res) => {
        if (err) throw err;
        const departmentArr = depArr(res);
        inquirer.prompt({
            name: "delDep",
            type: "list",
            message: "Which department would you like to delete?",
            choices: departmentArr
        }).then(answer => {
            connection.query(`DELETE FROM department WHERE id=?`, [answer.delDep.id], (err, res) => {
                if (err) throw err;
                allEmployees();
            })
        }).catch((error) => {
            console.log(error.message);
            res.json({ error: error.message });
        })

    })

}


const consoleResult = (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
}

const validator = function (input) {
    const letters = /^[A-Za-z]+$/;
    if (input.match(letters)) {
        // console.log(`SUCCESS  !!!  Added new name: ${input}`)
        return true;
    } else {
        console.log("ERROR  !!!  Your input can only contain upper and lower case letters, please try again")
        return false;
    }
}