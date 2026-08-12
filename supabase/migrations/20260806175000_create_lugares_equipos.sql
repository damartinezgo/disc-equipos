-- Migration: create lugares and equipos tables
-- Description: Add lugares and equipos tables for registration form

create table if not exists lugares (
  id bigserial primary key,
  nombre text not null unique
);

create table if not exists equipos (
  id bigserial primary key,
  nombre text not null,
  lugar_id bigint references lugares(id) on delete set null,
  unique(nombre, lugar_id)
);

insert into lugares (nombre) values ('Bogota') on conflict (nombre) do nothing;
insert into lugares (nombre) values ('Territorios') on conflict (nombre) do nothing;

insert into equipos (nombre, lugar_id) values ('DESPACHO PROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION AMAGA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DESPACHO VICEPROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION ANDES',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIRECCION DE APOYO ESTRATEGICO, ANALISIS DE DATOS E INFORMACION',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION ARMENIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIRECCION NACIONAL DE INVESTIGACIONES ESPECIALES',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION BUCARAMANGA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION ADMINISTRATIVA - SECRETARIA GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION BUENAVENTURA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION ADMINISTRATIVA Y FINANCIERA - IEMP',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CALI',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE CAPACITACION - IEMP',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CARMEN DE BOLIVAR',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE DOCUMENTACION - DESPACHO VICEPROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CARTAGENA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE GESTION HUMANA - SECRETARIA GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CARTAGO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE INVESTIGACIONES SOCIOPOLITICAS Y ASUNTOS SOCIOECONOMICOS - IEMP',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CHAPARRAL',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE REGISTRO DE SANCIONES Y CAUSAS DE INHABILIDAD - DESPACHO VICEPROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION CUCUTA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE RELACIONAMIENTO CON EL CIUDADANO - DESPACHO VICEPROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION EL BANCO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION DE SEGURIDAD - DESPACHO VICEPROCURADOR GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION FACATATIVA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('DIVISION FINANCIERA - SECRETARIA GENERAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION GARZON',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('INSTITUTO DE ESTUDIOS MINISTERIO PUBLICO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION GIRARDOT',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('OFICINA DE CONTROL INTERNO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION GUATEQUE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('OFICINA DE PLANEACION',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION HONDA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('OFICINA DE PRENSA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION IPIALES',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('OFICINA DE TECNOLOGIA, INNOVACION Y TRANSFORMACION DIGITAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION MAGANGUE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('OFICINA JURIDICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION MANIZALES',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA AUXILIAR ASUNTOS CONSTITUCIONALES',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION OCANA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA AUXILIAR ASUNTOS DISCIPLINARIOS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION POPAYAN',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 1: PARA LA DEFENSA DE LOS DERECHOS HUMANOS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION SANTA ROSA DE VITERBO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 10: PARA LA MORALIDAD Y TRANSPARENCIA PUBLICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION SANTAFE DE ANTIOQUIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 12: PRIMERA CON FUNCIONES DE INTERVENCION PARA LA JURISDICCION ESPECIAL PARA LA PAZ',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION SANTANDER DE QUILICHAO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 14:TERCERA CON FUNCIONES DE INTERVENCION PARA LA JURISDICCION ESPECIAL PARA LA PAZ',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION SINCELEJO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 15: PARA  ASUNTOS ELECTORALES Y PARTICIPACION DEMOCRATICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION SOGAMOSO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 2: PARA LA RESTITUCION DE TIERRAS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION TUNJA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 3: PARA ASUNTOS AMBIENTALES MINERO ENERGETICOS Y AGRARIOS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION VALLE DEL ABURRA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 4: PARA ASUNTOS CIVILES',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION VALLEDUPAR',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 5: PARA EL MINISTERIO PUBLICO EN ASUNTOS PENALES',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION VELEZ',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 6: PARA LA CONCILIACION ADMINISTRATIVA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION VILLAVICENCIO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 7: ASUNTOS DEL TRABAJO Y SEGURIDAD SOCIAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION YARUMAL',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA CON FUNCIONES MIXTAS 9: PARA EL SEGUIMIENTO A LOS RECURSOS DEL SISTEMA GENERAL DE REGALIAS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE INSTRUCCION ZIPAQUIRA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 1: PRIMERA PARA LA CASACION PENAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO BARRANQUILLA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 10: QUINTA ANTE EL CONSEJO DE ESTADO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO BUCARAMANGA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 3: PRIMERA PARA LA INVESTIGACION Y JUZGAMIENTO PENAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO CALI',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 5: TERCERA PARA LA INVESTIGACION Y JUZGAMIENTO PENAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO CARTAGENA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 6: PRIMERA ANTE EL CONSEJO DE ESTADO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO IBAGUE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 7: SEGUNDA ANTE EL CONSEJO DE ESTADO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO MONTERIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 8: TERCERA ANTE EL CONSEJO DE ESTADO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO NEIVA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DE INTERVENCION 9: CUARTA ANTE EL CONSEJO DE ESTADO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO OCANA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 1: PRIMERA PARA VIGILANCIA ADMINISTRATIVA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO PASTO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 10: PARA LA FUERZA PUBLICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO RIONEGRO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 2: SEGUNDA PARA VIGILANCIA ADMINISTRATIVA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO SAN GIL',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 3: TERCERA PARA VIGILANCIA ADMINISTRATIVA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PROVINCIAL DE JUZGAMIENTO VALLE DEL ABURRA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 7: SEGUNDA PARA LA CONTRATACION ESTATAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION ANTIOQUIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE INSTRUCCION 9: CUARTA PARA LA CONTRATACION ESTATAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION ARAUCA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA DISCIPLINARIA DE JUZGAMIENTO 4',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION BOLIVAR',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA FUNCIONES MIXTAS 8: PARA LA  DEFENSA DE LOS DERECHOS DE LA INFANCIA, LA  ADOLESCENCIA, LA FAMILIA Y LA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION CALDAS',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA PREVENTIVA Y DE CONTROL DE GESTION 1: PRIMERA PARA LA VIGILANCIA PREVENTIVA DE LA FUNCION PUBLICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION CASANARE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA PREVENTIVA Y DE CONTROL DE GESTION 2: SEGUNDA PARA LA VIGILANCIA PREVENTIVA DE LA FUNCION PUBLICA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION CHOCO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA PREVENTIVA Y DE CONTROL DE GESTION 3: PARA LA GESTION Y LA GOBERNANZA TERRITORIAL',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION CORDOBA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA PREVENTIVA Y DE CONTROL DE GESTION 4: PARA ASUNTOS ETNICOS',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION GUAINIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DELEGADA PREVENTIVA Y DE CONTROL DE GESTION 5: PARA EL SEGUIMIENTO DEL ACUERDO DE PAZ',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION GUAVIARE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA DISTRITAL DE JUZGAMIENTO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION HUILA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA PRIMERA DISTRITAL DE INSTRUCCION',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION LA GUAJIRA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION CUNDINAMARCA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION META',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO CUNDINAMARCA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION PUTUMAYO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('SALA DISCIPLINARIA DE INSTRUCCION',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION QUINDIO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('SALA DISCIPLINARIA DE JUZGAMIENTO DE SERVIDORES PUBLICOS DE ELECCION POPULAR',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION RISARALDA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('SALA DISCIPLINARIA ORDINARIA DE JUZGAMIENTO',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION SAN ANDRES',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('VEEDURIA',1) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION SANTANDER',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION SUCRE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION TOLIMA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION VALLE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL DE INSTRUCCION VAUPES',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO ANTIOQUIA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO ATLANTICO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO GUAVIARE',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO MAGDALENA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO META',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO NORTE DE SANTANDER',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO PUTUMAYO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO QUINDIO',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO RISARALDA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO SANTANDER',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO TOLIMA',2) on conflict (nombre, lugar_id) do nothing;
insert into equipos (nombre, lugar_id) values ('PROCURADURIA REGIONAL JUZGAMIENTO VALLE',2) on conflict (nombre, lugar_id) do nothing;

-- Add lugar column to perfiles table if it doesn't exist
alter table perfiles add column if not exists lugar text;
