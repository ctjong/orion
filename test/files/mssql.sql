IF exists (select * from sys.objects where name = 'errortable') DROP TABLE errortable;
IF exists (select * from sys.objects where name = 'usertable') DROP TABLE usertable;
IF exists (select * from sys.objects where name = 'itemtable') DROP TABLE itemtable;
IF exists (select * from sys.objects where name = 'messagetable') DROP TABLE messagetable;
IF exists (select * from sys.objects where name = 'assettable') DROP TABLE assettable;
CREATE TABLE errortable ([id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY, [tag] VARCHAR (10) NOT NULL, [statuscode] INT NOT NULL, [msg] VARCHAR (255) NOT NULL,[url] VARCHAR (255) NOT NULL, [timestamp] BIGINT NOT NULL);
CREATE TABLE usertable (
[firstname] VARCHAR (255) NULL,
[lastname] VARCHAR (255) NULL,
[id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
[domain] VARCHAR (255) NULL,
[domainid] VARCHAR (255) NULL,
[roles] VARCHAR (255) NULL,
[username] VARCHAR (255) NULL,
[password] VARCHAR (255) NULL,
[email] VARCHAR (255) NULL
);
CREATE TABLE itemtable (
[name] VARCHAR (255) NULL,
[date] INT DEFAULT 0,
[id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
[ownerid] INT NOT NULL
);
CREATE TABLE messagetable (
[recipientid] INT NOT NULL,
[text] VARCHAR (255) NULL,
[flagged] BIT DEFAULT 0,
[id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
[ownerid] INT NOT NULL
);
CREATE TABLE assettable (
[id] INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
[ownerid] INT NOT NULL,
[filename] VARCHAR (255) NULL
);
