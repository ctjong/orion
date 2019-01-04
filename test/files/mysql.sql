DROP TABLE IF EXISTS errortable;
DROP TABLE IF EXISTS usertable;
DROP TABLE IF EXISTS itemtable;
DROP TABLE IF EXISTS messagetable;
DROP TABLE IF EXISTS assettable;
CREATE TABLE errortable (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `tag` VARCHAR (10) NOT NULL, `statuscode` INT NOT NULL, `msg` VARCHAR (255) NOT NULL,`url` VARCHAR (255) NOT NULL, `timestamp` BIGINT NOT NULL);
CREATE TABLE usertable (
`firstname` VARCHAR (255) NULL,
`lastname` VARCHAR (255) NULL,
`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
`domain` VARCHAR (255) NULL,
`domainid` VARCHAR (255) NULL,
`roles` VARCHAR (255) NULL,
`username` VARCHAR (255) NULL,
`password` VARCHAR (255) NULL,
`email` VARCHAR (255) NULL
);
CREATE TABLE itemtable (
`name` VARCHAR (255) NULL,
`date` INT DEFAULT 0,
`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
`ownerid` INT NOT NULL
);
CREATE TABLE messagetable (
`recipientid` INT NOT NULL,
`text` VARCHAR (255) NULL,
`flagged` TINYINT(1) DEFAULT 0,
`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
`ownerid` INT NOT NULL
);
CREATE TABLE assettable (
`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
`ownerid` INT NOT NULL,
`filename` VARCHAR (255) NULL
);
