require('dotenv').config();
const mysql = require("mysql");
const cTable = require('console.table');
const inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "employee_tracker_db"
});

const mainMenuPrompt = {
    type: 'list',
    message: 'What would you like to do: ',
    choices: ['View All Employees', 'View All Employees By Department',
        'View All Employees By Manager', 'Add Employee', 'Remove Employee',
        'Update Employee Role', 'Update Employee Manager', 'View All Roles',
        'View All Departments'
    ],
    name: 'action'
}

const createEmployeePrompts = [{
        type: 'input',
        message: `Enter employee's first name: `,
        name: 'firstName'
    },
    {
        type: 'input',
        message: `Enter employee's last name: `,
        name: 'lastName'
    },
    {
        type: 'list',
        message: `Choose employee's role: `,
        choices: ['Sales Lead', 'Salesperson', 'Lead Engineer', 'Software Enginner', 'Account Manger', 'Accountant', 'Legal Team Lead', 'Lawyer'],
        name: 'role'
    },
    {
        type: 'list',
        message: `Choose employee's manager`,
        choices: ['none', 'Steve Cook'],
        name: 'manager'
    }
];

/* ----- DATABASE CONNECTION ----- */
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    userMainMenu();
});


/* ----- INQUIRY FUNCTIONS ----- */
function userMainMenu() {
    inquirer.prompt(mainMenuPrompt).then(res => {
        handleMainMenuSelect(res.action);
    })
}

function createEmployee() {
    inquirer.prompt(createEmployeePrompts).then(res => {
        console.log(res);
        let roleId = convertRoleToNum(res.role);
        /* FIX THIS SO THAT IT IS LIKE FUNCTION ABOVE BUT FOR MANAGER */
        let managerId = 7;
        createEmployeeQuery(res.firstName, res.lastName, roleId, managerId);
    })
}

function deleteEmployee() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);
        
        inquirer.prompt({
            type: 'list',
            message: 'Choose employee to remove: ',
            choices: employeesAsArr,
            name: 'employee'
        }).then(res => {
            let selection = separateIdFirstLastName(res.employee);
            deleteEmployeeQuery(selection);
        })
    })
}

function updateEmployeeRole() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);

        inquirer.prompt([{
            type: 'list',
            message: 'Choose employee to update: ',
            choices: employeesAsArr,
            name: 'employee'
        },
        {
            type: 'list',
            message: 'Choose new role: ',
            choices: ['Sales Lead', 'Salesperson', 'Lead Engineer', 'Software Enginner', 'Account Manger', 'Accountant', 'Legal Team Lead', 'Lawyer'],
            name: 'updatedRole'
        }]).then(res => {
            let selection = separateIdFirstLastName(res.employee);
            updateEmployeeRoleQuery(selection, res.updatedRole);
        })
    })
} 

function updateEmployeeManager() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);

        inquirer.prompt({
            type: 'list',
            message: 'Choose employee to update: ',
            choices: employeesAsArr,
            name: 'employee'
        }).then(res => {
            let selectedEmployee = separateIdFirstLastName(res.employee);
            connection.query(`Select id, first_name, last_name FROM employees WHERE id != ${selectedEmployee.id};`, function (err, results) {
                if (err) throw err;
                let managersAsArr = turnNameColsToArray(results);

                inquirer.prompt({
                    type: 'list',
                    message: 'Choose manger for employee: ',
                    choices: managersAsArr,
                    name: 'manager'
                }).then(res => {
                    let selectedManager = separateIdFirstLastName(res.manager);
                    updateEmployeManagerQuery(selectedEmployee, selectedManager);
                })
            })
        });    
    })

}

function handleMainMenuSelect(optionSelected) {
    switch (optionSelected) {
        case 'View All Employees':
            getAllEmployees();
            break;
        case 'View All Employees By Department':
            // code block
            break;
        case 'View All Employees By Manger':
            // code block
            break;
        case 'Add Employee':
            createEmployee();
            break;
        case 'Remove Employee':
            deleteEmployee();
            break;
        case 'Update Employee Role':
            updateEmployeeRole();
            break;
        case 'Update Employee Manager':
            updateEmployeeManager();
            break;
        case 'View All Roles':
            viewAllRoles();
            break;
        case 'View All Departments':
            viewAllDepartments();
            break;
        default:
            //getAllEmployees();
            console.log('default triggered');
    }
}

/* ----- QUERIES ----- */
// VIEW ALL EMPLOYEES
function getAllEmployees() {
    connection.query(`Select a.id, a.first_name, a.last_name, roles.title, 
    departments.name as department, roles.salary, CONCAT(b.first_name, ' ', b.last_name) as manager
        FROM employees a join roles on a.role_id = roles.id 
        join departments on roles.department_id = departments.id
        left join employees b on b.id = a.manager_id or a.manager_id = null;`, function (error, results, fields) {
        if (error) throw error;
        const table = cTable.getTable(results);
        console.log(table);
    });
}

function viewAllRoles() {
    connection.query(`select roles.id, title, salary, departments.name as department from roles 
    join departments where roles.department_id = departments.id;`, function (err, results) {
        if (err) throw err;
        const table = cTable.getTable(results);
        console.log(table);
    });
}

function viewAllDepartments() {
    connection.query(`select * from departments`, function (err, results) {
        if (err) throw err;
        const table = cTable.getTable(results);
        console.log(table);
    });
}

function createEmployeeQuery(firstName, lastName, roleId, managerId) {
    connection.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) 
    VALUES('${firstName}', '${lastName}', ${roleId}, ${managerId});`, function (error, results) {
        if (error) throw error;
        console.log('new Intry Added');
    })
}

function deleteEmployeeQuery(nameObj) {
    connection.query(`DELETE FROM employees WHERE id = ${nameObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName} removed from employees`);
    })
}

function updateEmployeeRoleQuery(nameObj, newRole) {
    connection.query(`UPDATE employees SET role_id = ${convertRoleToNum(newRole)} WHERE id = ${nameObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName}'s role was updated to ${newRole}`);
    })
}

function updateEmployeManagerQuery(employeeObj, newManagerObj) {
    connection.query(`UPDATE employees SET manager_id = ${newManagerObj.id} Where id = ${employeeObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${employeeObj.firstName} ${employeeObj.lastName}'s manager was updated to ${newManagerObj.firstName} ${newManagerObj.lastName}`);
    })
}

/* ---- OTHER FUNCTIONS ----- */
function convertRoleToNum(input) {
    switch (input) {
        case 'Sales Lead':
            return 1;
        case 'Salesperson':
            return 2;
        case 'Lead Engineer':
            return 3;
        case 'Software Enginner':
            return 4;
        case 'Account Manger':
            return 5;
        case 'Accountant':
            return 6;
        case 'Legal Team Lead':
            return 7;
        case 'Lawyer':
            return 8;
        default:
            return 0;
    }
}

function turnNameColsToArray(input) {
    let tempResult = '';
    let formattedResult = [];

    for (let i = 0; i < input.length; i++) {
        tempResult = `id:${input[i].id} ${input[i].first_name} ${input[i].last_name}`;
        formattedResult.push(tempResult);
    }
    return formattedResult;
}

function separateIdFirstLastName(name) {
    let nameArr = name.split(' ');
    return {
        id: getNumFromIdString(nameArr[0]),
        firstName: nameArr[1],
        lastName: nameArr[2]
    };
}

function getNumFromIdString (input) {
    let findNums = /[0-9]+/;
    let result = input.match(findNums);
    return Number(result);
}

//connection.end();