-- Premier relevé d'une année.
select datetime(dtElec, 'unixepoch', 'localtime'), elec from elecLog where dtElec = (select min(dtElec) from elecLog where dtElec >= strftime('%s', '2017-01-01 00:00:00'));

-- Dernier relevé saisi :
select datetime(dtElec, 'unixepoch', 'localtime'), elec from elecLog where dtElec = (select max(dtElec) from elecLog);

-- Dernier relevé d'une année
select datetime(dtElec, 'unixepoch', 'localtime'), elec from elecLog where dtElec = (select max(dtElec) from elecLog where dtElec <= strftime('%s', '2017-01-01 00:00:00'));
