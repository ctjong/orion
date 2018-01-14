DROP TABLE IF EXISTS errortable;
DROP TABLE IF EXISTS assettable;
DROP TABLE IF EXISTS usertable;
DROP TABLE IF EXISTS tasktable;
DROP TABLE IF EXISTS plantable;
DROP TABLE IF EXISTS plantasktable;
DROP TABLE IF EXISTS planenrollmenttable;
CREATE TABLE errortable (`id` INT NOT NULL PRIMARY KEY, `tag` VARCHAR (10) NOT NULL, `statuscode` INT NOT NULL, `msg` VARCHAR (255) NOT NULL,`url` VARCHAR (255) NOT NULL, `timestamp` BIGINT NOT NULL);
CREATE TABLE assettable (
`id` INT NOT NULL PRIMARY KEY,
`ownerid` INT NOT NULL,
`filename` VARCHAR (255) NULL
);
CREATE TABLE usertable (
`id` INT NOT NULL PRIMARY KEY,
`domain` VARCHAR (255) NULL,
`domainid` VARCHAR (255) NULL,
`roles` VARCHAR (255) NULL,
`username` VARCHAR (255) NULL,
`password` VARCHAR (255) NULL,
`email` VARCHAR (255) NULL,
`firstname` VARCHAR (255) NULL,
`lastname` VARCHAR (255) NULL,
`createdtime` BIGINT NOT NULL
);
CREATE TABLE tasktable (
`id` INT NOT NULL PRIMARY KEY,
`ownerid` INT NOT NULL,
`name` VARCHAR (255) NULL,
`date` INT DEFAULT 0,
`recmode` INT DEFAULT 0,
`recdays` VARCHAR (255) NULL,
`recinterval` INT DEFAULT 0,
`recend` INT DEFAULT 0,
`recholes` VARCHAR (255) NULL,
`createdtime` BIGINT NOT NULL
);
CREATE TABLE plantable (
`id` INT NOT NULL PRIMARY KEY,
`ownerid` INT NOT NULL,
`state` INT DEFAULT 0,
`name` VARCHAR (255) NULL,
`description` VARCHAR (255) NULL,
`createdtime` BIGINT NOT NULL
);
CREATE TABLE plantasktable (
`id` INT NOT NULL PRIMARY KEY,
`ownerid` INT NOT NULL,
`planid` INT NOT NULL,
`state` INT DEFAULT 0,
`day` INT DEFAULT 0,
`name` VARCHAR (255) NULL,
`description` VARCHAR (255) NULL,
`createdtime` BIGINT NOT NULL
);
CREATE TABLE planenrollmenttable (
`id` INT NOT NULL PRIMARY KEY,
`ownerid` INT NOT NULL,
`planid` INT NOT NULL,
`startdate` INT DEFAULT 0,
`completeddays` INT DEFAULT 0,
`createdtime` BIGINT NOT NULL,
UNIQUE (`ownerid`,`planid`)
);
