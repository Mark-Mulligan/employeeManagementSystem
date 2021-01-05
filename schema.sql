Drop Database IF exists employee_tracker_db;
CREATE DATABASE employee_tracker_db;

Use employee_tracker_db;

CREATE TABLE departments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY Key,
    name VARCHAR(30)
);

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY Key,
  title VARCHAR(30),
  salary DECIMAL,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id) 
);

CREATE TABLE employees (
	id INT NOT NULL AUTO_INCREMENT PRIMARY Key,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role_id INT,
    manager_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) 
);

SELECT * FROM roles;