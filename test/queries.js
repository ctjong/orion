module.exports = 
{
    "insertError":
    {
        "mssql": "insert into [errortable] ([tag],[statuscode],[msg],[url],[timestamp]) values (@value0 ,@value1 ,@value2 ,@value3 ,@value4 ); select SCOPE_IDENTITY() as [identity];",
        "mysql": "insert into `errortable` (`tag`,`statuscode`,`msg`,`url`,`timestamp`) values (?,?,?,?,?)"
    },
    "selectUserNameByUserName":
    {
        "mssql": "select [usertable].[username] from [usertable] where ([usertable].[username]=@value0 ) order by [usertable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `usertable`.`username` from `usertable` where (`usertable`.`username`=?) order by `usertable`.`id`  LIMIT ? OFFSET ?"
    },
    "selectUserDataByUserName":
    {
        "mssql": "select [usertable].[id], [usertable].[password], [usertable].[roles], [usertable].[domain], [usertable].[firstname], [usertable].[lastname] from [usertable] where ([usertable].[userName]=@value0 ) order by [usertable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `usertable`.`id`, `usertable`.`password`, `usertable`.`roles`, `usertable`.`domain`, `usertable`.`firstname`, `usertable`.`lastname` from `usertable` where (`usertable`.`userName`=?) order by `usertable`.`id`  LIMIT ? OFFSET ?"
    },
    "insertUser":
    {
        "mssql": "insert into [usertable] ([username],[password],[email],[firstname],[lastname],[roles],[domain],[createdtime]) values (@value0 ,@value1 ,@value2 ,@value3 ,@value4 ,@value5 ,@value6 ,@value7 ); select SCOPE_IDENTITY() as [identity];",
        "mysql": "insert into `usertable` (`username`,`password`,`email`,`firstname`,`lastname`,`roles`,`domain`,`createdtime`) values (?,?,?,?,?,?,?,?)"
    },
    "countUserById":
    {
        "mssql": "select count(*) from [usertable] where ([usertable].[id]=@value0 )",
        "mysql": "select count(*) as count from `usertable` where (`usertable`.`id`=?)"
    },
    "selectUserDataById":
    {
        "mssql": "select [usertable].[firstname], [usertable].[lastname], [usertable].[id], [usertable].[domain], [usertable].[domainid], [usertable].[roles], [usertable].[username], [usertable].[email], [usertable].[createdtime] from [usertable] where ([usertable].[id]=@value0 ) order by [usertable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `usertable`.`firstname`, `usertable`.`lastname`, `usertable`.`id`, `usertable`.`domain`, `usertable`.`domainid`, `usertable`.`roles`, `usertable`.`username`, `usertable`.`email`, `usertable`.`createdtime` from `usertable` where (`usertable`.`id`=?) order by `usertable`.`id`  LIMIT ? OFFSET ?"
    },
    "countUserById2":
    {
        "mssql": "select count(*) from [usertable] where ([usertable].[id]=@value0  AND [usertable].[id]=@value1 )",
        "mysql": "select count(*) as count from `usertable` where (`usertable`.`id`=? AND `usertable`.`id`=?)"
    },
    "selectUserDataById2":
    {
        "mssql": "select [usertable].[firstname], [usertable].[lastname], [usertable].[id], [usertable].[domain], [usertable].[domainid], [usertable].[roles], [usertable].[username], [usertable].[email], [usertable].[createdtime] from [usertable] where ([usertable].[id]=@value0  AND [usertable].[id]=@value1 ) order by [usertable].[id]  OFFSET (@value2 ) ROWS FETCH NEXT (@value3 ) ROWS ONLY",
        "mysql": "select `usertable`.`firstname`, `usertable`.`lastname`, `usertable`.`id`, `usertable`.`domain`, `usertable`.`domainid`, `usertable`.`roles`, `usertable`.`username`, `usertable`.`email`, `usertable`.`createdtime` from `usertable` where (`usertable`.`id`=? AND `usertable`.`id`=?) order by `usertable`.`id`  LIMIT ? OFFSET ?"
    },
    "selectUserDataById3":
    {
        "mssql": "select [usertable].[firstname], [usertable].[lastname], [usertable].[id], [usertable].[domain], [usertable].[domainid], [usertable].[roles], [usertable].[username], [usertable].[email], [usertable].[createdtime] from [usertable] where [usertable].[id]=@value0  order by [usertable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `usertable`.`firstname`, `usertable`.`lastname`, `usertable`.`id`, `usertable`.`domain`, `usertable`.`domainid`, `usertable`.`roles`, `usertable`.`username`, `usertable`.`email`, `usertable`.`createdtime` from `usertable` where `usertable`.`id`=? order by `usertable`.`id`  LIMIT ? OFFSET ?"
    },
    "updateUserFullNameById":
    {
        "mssql": "update [usertable] set firstname=@value0 ,lastname=@value1  where [usertable].[id]=@value2",
        "mysql": "update `usertable` set firstname=?,lastname=? where `usertable`.`id`=?"
    },
    "insertItem":
    {
        "mssql": "insert into [itemtable] ([name],[date],[ownerid],[createdtime]) values (@value0 ,@value1 ,@value2 ,@value3 ); select SCOPE_IDENTITY() as [identity];",
        "mysql": "insert into `itemtable` (`name`,`date`,`ownerid`,`createdtime`) values (?,?,?,?)"
    },
    "countItemByIdAndOwner":
    {
        "mssql": "select count(*) from [itemtable] where ([itemtable].[id]=@value0  AND [itemtable].[ownerid]=@value1 )",
        "mysql": "select count(*) as count from `itemtable` where (`itemtable`.`id`=? AND `itemtable`.`ownerid`=?)"
    },
    "selectItemByIdAndOwner":
    {
        "mssql": "select [itemtable].[name], [itemtable].[date], [itemtable].[id], [itemtable].[ownerid], [itemtable].[createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [itemtable] INNER JOIN [usertable] [owner] ON [itemtable].[ownerid] = [owner].[id] where ([itemtable].[id]=@value0  AND [itemtable].[ownerid]=@value1 ) order by [itemtable].[id]  OFFSET (@value2 ) ROWS FETCH NEXT (@value3 ) ROWS ONLY",
        "mysql": "select `itemtable`.`name`, `itemtable`.`date`, `itemtable`.`id`, `itemtable`.`ownerid`, `itemtable`.`createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `itemtable` INNER JOIN `usertable` `owner` ON `itemtable`.`ownerid` = `owner`.`id` where (`itemtable`.`id`=? AND `itemtable`.`ownerid`=?) order by `itemtable`.`id`  LIMIT ? OFFSET ?"
    },
    "countItemByDateAndOwner":
    {
        "mssql": "select count(*) from [itemtable] where (([itemtable].[date]>@value0 ) AND [itemtable].[ownerid]=@value1 )",
        "mysql": "select count(*) as count from `itemtable` where ((`itemtable`.`date`>?) AND `itemtable`.`ownerid`=?)"
    },
    "selectItemByDateAndOwner":
    {
        "mssql": "select [itemtable].[name], [itemtable].[date], [itemtable].[id], [itemtable].[ownerid], [itemtable].[createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [itemtable] INNER JOIN [usertable] [owner] ON [itemtable].[ownerid] = [owner].[id] where (([itemtable].[date]>@value0 ) AND [itemtable].[ownerid]=@value1 ) order by [itemtable].[id]  OFFSET (@value2 ) ROWS FETCH NEXT (@value3 ) ROWS ONLY",
        "mysql": "select `itemtable`.`name`, `itemtable`.`date`, `itemtable`.`id`, `itemtable`.`ownerid`, `itemtable`.`createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `itemtable` INNER JOIN `usertable` `owner` ON `itemtable`.`ownerid` = `owner`.`id` where ((`itemtable`.`date`>?) AND `itemtable`.`ownerid`=?) order by `itemtable`.`id`  LIMIT ? OFFSET ?"
    },
    "countItemByNameAndOwner":
    {
        "mssql": "select count(*) from [itemtable] where (([itemtable].[name] like @value0 ) AND [itemtable].[ownerid]=@value1 )",
        "mysql": "select count(*) as count from `itemtable` where ((`itemtable`.`name` like ? ) AND `itemtable`.`ownerid`=?)"
    },
    "selectItemByNameAndOwner":
    {
        "mssql": "select [itemtable].[name], [itemtable].[date], [itemtable].[id], [itemtable].[ownerid], [itemtable].[createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [itemtable] INNER JOIN [usertable] [owner] ON [itemtable].[ownerid] = [owner].[id] where (([itemtable].[name] like @value0 ) AND [itemtable].[ownerid]=@value1 ) order by [itemtable].[id]  OFFSET (@value2 ) ROWS FETCH NEXT (@value3 ) ROWS ONLY",
        "mysql": "select `itemtable`.`name`, `itemtable`.`date`, `itemtable`.`id`, `itemtable`.`ownerid`, `itemtable`.`createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `itemtable` INNER JOIN `usertable` `owner` ON `itemtable`.`ownerid` = `owner`.`id` where ((`itemtable`.`name` like ? ) AND `itemtable`.`ownerid`=?) order by `itemtable`.`id`  LIMIT ? OFFSET ?"
    },
    "countItemByOwner":
    {
        "mssql": "select count(*) from [itemtable] where ([itemtable].[ownerid]=@value0 )",
        "mysql": "select count(*) as count from `itemtable` where (`itemtable`.`ownerid`=?)"
    },
    "selectItemByOwner":
    {
        "mssql": "select [itemtable].[name], [itemtable].[date], [itemtable].[id], [itemtable].[ownerid], [itemtable].[createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [itemtable] INNER JOIN [usertable] [owner] ON [itemtable].[ownerid] = [owner].[id] where ([itemtable].[ownerid]=@value0 ) order by [itemtable].[createdtime]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `itemtable`.`name`, `itemtable`.`date`, `itemtable`.`id`, `itemtable`.`ownerid`, `itemtable`.`createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `itemtable` INNER JOIN `usertable` `owner` ON `itemtable`.`ownerid` = `owner`.`id` where (`itemtable`.`ownerid`=?) order by `itemtable`.`createdtime`  LIMIT ? OFFSET ?"
    },
    "selectItemById":
    {
        "mssql": "select [itemtable].[name], [itemtable].[date], [itemtable].[id], [itemtable].[ownerid], [itemtable].[createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [itemtable] INNER JOIN [usertable] [owner] ON [itemtable].[ownerid] = [owner].[id] where [itemtable].[id]=@value0  order by [itemtable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `itemtable`.`name`, `itemtable`.`date`, `itemtable`.`id`, `itemtable`.`ownerid`, `itemtable`.`createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `itemtable` INNER JOIN `usertable` `owner` ON `itemtable`.`ownerid` = `owner`.`id` where `itemtable`.`id`=? order by `itemtable`.`id`  LIMIT ? OFFSET ?"
    },
    "updateItemById":
    {
        "mssql": "update [itemtable] set name=@value0  where [itemtable].[id]=@value1",
        "mysql": "update `itemtable` set name=? where `itemtable`.`id`=?"
    },
    "deleteItemById":
    {
        "mssql": "delete from [itemtable] where [itemtable].[id]=@value0",
        "mysql": "delete from `itemtable` where `itemtable`.`id`=?"
    },
    "insertMessage":
    {
        "mssql": "insert into [messagetable] ([recipientid],[text],[ownerid],[createdtime]) values (@value0 ,@value1 ,@value2 ,@value3 ); select SCOPE_IDENTITY() as [identity];",
        "mysql": "insert into `messagetable` (`recipientid`,`text`,`ownerid`,`createdtime`) values (?,?,?,?)"
    },
    "countMessageByOwnerAndRecipient":
    {
        "mssql": "select count(*) from [messagetable] where (((([messagetable].[ownerid]=@value0 )) AND (([messagetable].[recipientid]=@value1 ))) AND ((([messagetable].[ownerid]=@value2 ) OR ([messagetable].[recipientid]=@value3 ))))",
        "mysql": "select count(*) as count from `messagetable` where ((((`messagetable`.`ownerid`=?)) AND ((`messagetable`.`recipientid`=?))) AND (((`messagetable`.`ownerid`=?) OR (`messagetable`.`recipientid`=?))))"
    },
    "selectMessageByOwnerAndRecipient":
    {
        "mssql": "select [messagetable].[recipientid], [messagetable].[text], [messagetable].[flagged], [messagetable].[id], [messagetable].[ownerid], [messagetable].[createdtime], [recipient].[firstname] AS [recipient_firstname], [recipient].[lastname] AS [recipient_lastname], [recipient].[id] AS [recipient_id], [recipient].[domain] AS [recipient_domain], [recipient].[domainid] AS [recipient_domainid], [recipient].[roles] AS [recipient_roles], [recipient].[username] AS [recipient_username], [recipient].[email] AS [recipient_email], [recipient].[createdtime] AS [recipient_createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [messagetable] INNER JOIN [usertable] [recipient] ON [messagetable].[recipientid] = [recipient].[id] INNER JOIN [usertable] [owner] ON [messagetable].[ownerid] = [owner].[id] where (((([messagetable].[ownerid]=@value0 )) AND (([messagetable].[recipientid]=@value1 ))) AND ((([messagetable].[ownerid]=@value2 ) OR ([messagetable].[recipientid]=@value3 )))) order by [messagetable].[id]  OFFSET (@value4 ) ROWS FETCH NEXT (@value5 ) ROWS ONLY",
        "mysql": "select `messagetable`.`recipientid`, `messagetable`.`text`, `messagetable`.`flagged`, `messagetable`.`id`, `messagetable`.`ownerid`, `messagetable`.`createdtime`, `recipient`.`firstname` AS `recipient_firstname`, `recipient`.`lastname` AS `recipient_lastname`, `recipient`.`id` AS `recipient_id`, `recipient`.`domain` AS `recipient_domain`, `recipient`.`domainid` AS `recipient_domainid`, `recipient`.`roles` AS `recipient_roles`, `recipient`.`username` AS `recipient_username`, `recipient`.`email` AS `recipient_email`, `recipient`.`createdtime` AS `recipient_createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `messagetable` INNER JOIN `usertable` `recipient` ON `messagetable`.`recipientid` = `recipient`.`id` INNER JOIN `usertable` `owner` ON `messagetable`.`ownerid` = `owner`.`id` where ((((`messagetable`.`ownerid`=?)) AND ((`messagetable`.`recipientid`=?))) AND (((`messagetable`.`ownerid`=?) OR (`messagetable`.`recipientid`=?)))) order by `messagetable`.`id`  LIMIT ? OFFSET ?"
    },
    "selectMessageById":
    {
        "mssql": "select [messagetable].[recipientid], [messagetable].[text], [messagetable].[flagged], [messagetable].[id], [messagetable].[ownerid], [messagetable].[createdtime], [recipient].[firstname] AS [recipient_firstname], [recipient].[lastname] AS [recipient_lastname], [recipient].[id] AS [recipient_id], [recipient].[domain] AS [recipient_domain], [recipient].[domainid] AS [recipient_domainid], [recipient].[roles] AS [recipient_roles], [recipient].[username] AS [recipient_username], [recipient].[email] AS [recipient_email], [recipient].[createdtime] AS [recipient_createdtime], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [messagetable] INNER JOIN [usertable] [recipient] ON [messagetable].[recipientid] = [recipient].[id] INNER JOIN [usertable] [owner] ON [messagetable].[ownerid] = [owner].[id] where [messagetable].[id]=@value0  order by [messagetable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `messagetable`.`recipientid`, `messagetable`.`text`, `messagetable`.`flagged`, `messagetable`.`id`, `messagetable`.`ownerid`, `messagetable`.`createdtime`, `recipient`.`firstname` AS `recipient_firstname`, `recipient`.`lastname` AS `recipient_lastname`, `recipient`.`id` AS `recipient_id`, `recipient`.`domain` AS `recipient_domain`, `recipient`.`domainid` AS `recipient_domainid`, `recipient`.`roles` AS `recipient_roles`, `recipient`.`username` AS `recipient_username`, `recipient`.`email` AS `recipient_email`, `recipient`.`createdtime` AS `recipient_createdtime`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `messagetable` INNER JOIN `usertable` `recipient` ON `messagetable`.`recipientid` = `recipient`.`id` INNER JOIN `usertable` `owner` ON `messagetable`.`ownerid` = `owner`.`id` where `messagetable`.`id`=? order by `messagetable`.`id`  LIMIT ? OFFSET ?"
    },
    "updateMessageById":
    {
        "mssql": "update [messagetable] set flagged=@value0  where [messagetable].[id]=@value1",
        "mysql": "update `messagetable` set flagged=? where `messagetable`.`id`=?"
    },
    "insertAsset":
    {
        "mssql": "insert into [assettable] ([ownerid],[filename]) values (@value0 ,@value1 ); select SCOPE_IDENTITY() as [identity];",
        "mysql": "insert into `assettable` (`ownerid`,`filename`) values (?,?)"
    },
    "countAssetByIdAndOwner":
    {
        "mssql": "select count(*) from [assettable] where ([assettable].[id]=@value0  AND [assettable].[ownerid]=@value1 )",
        "mysql": "select count(*) as count from `assettable` where (`assettable`.`id`=?  AND `assettable`.`ownerid`=? )"
    },
    "selectAssetByIdAndOwner":
    {
        "mssql": "select [assettable].[id], [assettable].[ownerid], [assettable].[filename], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [assettable] INNER JOIN [usertable] [owner] ON [assettable].[ownerid] = [owner].[id] where ([assettable].[id]=@value0  AND [assettable].[ownerid]=@value1 ) order by [assettable].[id]  OFFSET (@value2 ) ROWS FETCH NEXT (@value3 ) ROWS ONLY",
        "mysql": "select `assettable`.`id`, `assettable`.`ownerid`, `assettable`.`filename`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `assettable` INNER JOIN `usertable` `owner` ON `assettable`.`ownerid` = `owner`.`id` where (`assettable`.`id`=?  AND `assettable`.`ownerid`=? ) order by `assettable`.`id`  LIMIT ? OFFSET ?"
    },
    "selectAssetById":
    {
        "mssql": "select [assettable].[id], [assettable].[ownerid], [assettable].[filename], [owner].[firstname] AS [owner_firstname], [owner].[lastname] AS [owner_lastname], [owner].[id] AS [owner_id], [owner].[domain] AS [owner_domain], [owner].[domainid] AS [owner_domainid], [owner].[roles] AS [owner_roles], [owner].[username] AS [owner_username], [owner].[email] AS [owner_email], [owner].[createdtime] AS [owner_createdtime] from [assettable] INNER JOIN [usertable] [owner] ON [assettable].[ownerid] = [owner].[id] where [assettable].[id]=@value0  order by [assettable].[id]  OFFSET (@value1 ) ROWS FETCH NEXT (@value2 ) ROWS ONLY",
        "mysql": "select `assettable`.`id`, `assettable`.`ownerid`, `assettable`.`filename`, `owner`.`firstname` AS `owner_firstname`, `owner`.`lastname` AS `owner_lastname`, `owner`.`id` AS `owner_id`, `owner`.`domain` AS `owner_domain`, `owner`.`domainid` AS `owner_domainid`, `owner`.`roles` AS `owner_roles`, `owner`.`username` AS `owner_username`, `owner`.`email` AS `owner_email`, `owner`.`createdtime` AS `owner_createdtime` from `assettable` INNER JOIN `usertable` `owner` ON `assettable`.`ownerid` = `owner`.`id` where `assettable`.`id`=? order by `assettable`.`id`  LIMIT ? OFFSET ?"
    },
    "deleteAssetById":
    {
        "mssql": "delete from [assettable] where [assettable].[id]=@value0",
        "mysql": "delete from `assettable` where `assettable`.`id`=?"
    }
};