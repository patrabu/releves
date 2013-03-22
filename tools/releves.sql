--
--    releves.sql
--    ~~~~~~~~~~~
--    
--    This file contains the description of the tables for the RELEVES database.
--    
--    :copyright: (c) 2013 by Patrick Rabu.
--    :license: GPL-3, see LICENSE for more details.    
--

-- Table CESILOG : Sensors values and booster indicator.
-- * 1st sensor is the collector sensor.
-- * 2nd sensor is the bottom of the storage tank sensor.
-- * 3rd sensor is the top of middle of the storage tank sensor.
drop table if exists cesiLog;
create table cesiLog (
    dtCesi integer not null primary key,
    sensor1 real,
    sensor2 real,
    sensor3 real,
    appoint integer
);

-- Table ELECLOG : Electrical indexes 
drop table if exists elecLog;
create table elecLog (
    dtElec integer not null primary key,
    elec integer
);