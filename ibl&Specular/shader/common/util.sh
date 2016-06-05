#ifndef MSET_UTIL_H
#define MSET_UTIL_H

vec3	mulVec( mat4 m, vec3 v )
{
	return col0(m).xyz*v.x + (col1(m).xyz*v.y + (col2(m).xyz*v.z));
}

vec4	mulPoint( mat4 m, vec3 p )
{
	return col0(m)*p.x + (col1(m)*p.y + (col2(m)*p.z + col3(m)));
}

#endif