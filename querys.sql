/* returns all of employees and roles table */
SELECT * FROM employees JOIN roles
Where employees.role_id = roles.id;

/* returns specific parts of employes and roles tables */
SELECT employees.id, first_name, last_name, title, salary FROM employees JOIN roles
Where employees.role_id = roles.id;


/* returans all of roles and deparments joined */
SELECT * FROM roles JOIN departments
Where roles.department_id = departments.id;

/* Joins Everything From Three Tables */
Select * FROM employees join roles on employees.role_id = roles.id join departments on roles.department_id = departments.id;
/* SELECT t1.col, t3.col FROM table1 join table2 ON table1.primarykey = table2.foreignkey
join table3 ON table2.primarykey = table3.foreignkey */

/* Joins 3 tables with specific columns displayed */
Select employees.id, employees.first_name, employees.last_name, roles.title, departments.name, roles.salary, employees.manager_id 
FROM employees join roles on employees.role_id = roles.id 
join departments on roles.department_id = departments.id;

