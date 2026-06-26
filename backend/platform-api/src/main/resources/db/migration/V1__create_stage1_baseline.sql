create table tenant_account (
    id varchar(36) primary key,
    name varchar(120) not null,
    status varchar(32) not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    version bigint not null
);

create unique index ux_tenant_account_name on tenant_account (name);
