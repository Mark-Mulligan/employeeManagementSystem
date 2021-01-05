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

/* ----- INQUIRER PROMPTS ----- */
const mainMenuPrompt = {
    type: 'list',
    message: 'What would you like to do: ',
    choices: ['View All Employees', 'View All Employees By Department',
        'View All Employees By Manager', 'Add Employee', 'Remove Employee',
        'Update Employee Role', 'Update Employee Manager', 'View All Roles',
        'Add New Role', 'View All Departments', 'Add New Department'
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

const createDepartmentPropmt = {
    type: 'input',
    message: 'Enter the name of the new department: ',
    name: 'name'
};

/* ----- VIEW ONLY QUERIES ----- */
const viewAllEmployeesScript = `Select a.id, a.first_name, a.last_name, roles.title, 
departments.name as department, roles.salary, CONCAT(b.first_name, ' ', b.last_name) as manager
    FROM employees a join roles on a.role_id = roles.id 
    join departments on roles.department_id = departments.id
    left join employees b on b.id = a.manager_id or a.manager_id = null;`;

const viewAllRolesScript = `select roles.id, title, salary, departments.name as department from roles 
join departments where roles.department_id = departments.id;`;

const viewAllDepartmentsScript = `select * from departments`;
/* ----- DATABASE CONNECTION ----- */
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    userMainMenu();
});

/* ----- MAIN PROGRAM LOGIC ----- */
function userMainMenu() {
    inquirer.prompt(mainMenuPrompt).then(res => {
        handleMainMenuSelect(res.action);
    })
}

function handleMainMenuSelect(optionSelected) {
    switch (optionSelected) {
        case 'View All Employees':
            viewAllQuery(viewAllEmployeesScript);
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
            viewAllQuery(viewAllRolesScript);
            break;
        case 'Add New Role':
            createRole();
            break;
        case 'View All Departments':
            viewAllQuery(viewAllDepartmentsScript);
            break;
        case 'Add New Department':
            createDepartment();
            break;
        default:
            console.log('default triggered');
    }
}

//Had to put this inside each query function because of async activity with database.
function continueProgram() {
    inquirer.prompt({
        type: 'confirm',
        message: 'Would you like to do something else? ',
        name: 'continue'
    }).then(res => {
        if (res.continue) userMainMenu();
        else connection.end();
    })
}

/* ----- INQUIRY FUNCTIONS ----- */
function createEmployee() {
    connection.query(`select id, first_name, last_name from employees;`, function (err, allEmployees) {
        if (err) throw err;
        let employeeList = turnNameColsToArray(allEmployees);

        inquirer.prompt([{
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
            choices: employeeList,
            name: 'manager'
        }]).then(res => {
            let roleId = convertRoleToNum(res.role);
            let manager = separateIdFirstLastName(res.manager);
            createEmployeeQuery(res.firstName, res.lastName, roleId, manager.id);
        })
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
            }
        ]).then(res => {
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

function createRole() {
    let departments = [];

    connection.query(`Select * from departments`, function (err, departmentResults) {
        if (err) throw err;
        departmentResults.forEach(result => {
            departments.push(result.name);
        })

        inquirer.prompt([{
                type: 'input',
                message: 'Enter the name of the role: ',
                name: 'roleName'
            },
            {
                type: 'number',
                message: 'Enter the salary for this position (numbers only): ',
                name: 'salary'
            },
            {
                type: 'list',
                message: 'Choose the department that the role belong to: ',
                choices: departments,
                name: 'department'
            }
        ]).then(res => {
            let departmentId = getDepartmentId(departmentResults, res.department)
            createRoleQuery(res.roleName, res.salary, departmentId);
        })
    });
}

function createDepartment() {
    inquirer.prompt(createDepartmentPropmt).then(res => {
        createDepartmentQuery(res.name);
    })
}

/* ----- QUERIES ----- */
function viewAllQuery(mySqlScript) {
    connection.query(mySqlScript, function (err, results) {
        if (err) throw err;
        const table = cTable.getTable(results);
        console.log('');
        console.log(table);
        continueProgram();
    })
}

function createEmployeeQuery(firstName, lastName, roleId, managerId) {
    connection.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) 
    VALUES('${firstName}', '${lastName}', ${roleId}, ${managerId});`, function (error, results) {
        if (error) throw error;
        console.log('new Intry Added');
        continueProgram();
    })
}

function createDepartmentQuery(name) {
    connection.query(`insert into departments (name) values ('${name}');`, function (err, results) {
        if (err) throw err;
        console.log('new Department Added');
        continueProgram();
    })
}

function createRoleQuery(title, salary, department_id) {
    connection.query(`insert into roles (title, salary, department_id) 
    values ('${title}', ${salary}, ${department_id});`, function (err, results) {
        if (err) throw err;
        console.log('New Role Added');
        continueProgram();
    })
}

function deleteEmployeeQuery(nameObj) {
    connection.query(`DELETE FROM employees WHERE id = ${nameObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName} removed from employees`);
        continueProgram();
    })
}

function updateEmployeeRoleQuery(nameObj, newRole) {
    connection.query(`UPDATE employees SET role_id = ${convertRoleToNum(newRole)} WHERE id = ${nameObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName}'s role was updated to ${newRole}`);
        continueProgram();
    })
}

function updateEmployeManagerQuery(employeeObj, newManagerObj) {
    connection.query(`UPDATE employees SET manager_id = ${newManagerObj.id} Where id = ${employeeObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${employeeObj.firstName} ${employeeObj.lastName}'s manager was updated to ${newManagerObj.firstName} ${newManagerObj.lastName}`);
        continueProgram();
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

function getDepartmentId(inputArr, targetName) {
    let departmentId = 0;
    for (let i = 0; i < inputArr.length; i++) {
        if (inputArr[i].name === targetName) {
            departmentId = inputArr[i].id;
        }
    }
    return departmentId;
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

function getNumFromIdString(input) {
    let findNums = /[0-9]+/;
    let result = input.match(findNums);
    return Number(result);
}

//connection.end();