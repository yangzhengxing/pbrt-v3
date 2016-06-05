#include "../common/util.sh"
#include "state.vert"

#ifndef MSET_TESSELLATION
	uniform mat4	uModelLightMatrix;
	uniform mat4	uModelInverseTransposeLightMatrix;
	uniform mat4	uModelViewProjectionMatrix;
#endif

vec3	decodeUnitVector( vec3 v )
{
	return (2.0*(1023.0/1022.0))*v - vec3(1.0,1.0,1.0);
}

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec4,vColor)
	INPUT2(vec3,vTangent)
	INPUT3(vec3,vBitangent)
	INPUT4(vec3,vNormal)
	INPUT5(vec4,vTexCoord)

	OUTPUT0(vec3,fPosition)
	OUTPUT1(vec4,fColor)
	OUTPUT2(vec3,fTangent)
	OUTPUT3(vec3,fBitangent)
	OUTPUT4(vec3,fNormal)
	OUTPUT5(vec4,fTexCoord)
END_PARAMS
{
	VertexState s;
	s.position = vPosition;
	s.tangent = decodeUnitVector( vTangent );
	s.bitangent = decodeUnitVector( vBitangent );
	s.normal = decodeUnitVector( vNormal );
	s.color = vColor;
	s.texCoord = vTexCoord;
	
	#ifdef Surface
		Surface(s);
	#endif

	#ifdef MSET_TESSELLATION
		OUT_POSITION.xyz = s.position;
		OUT_POSITION.w = 1.0;
		fPosition = s.position;
		fTangent = s.tangent;
		fBitangent = s.bitangent;
		fNormal = s.normal;
	#else
		OUT_POSITION = mulPoint( uModelViewProjectionMatrix, s.position );
		fPosition = mulPoint( uModelLightMatrix, s.position ).xyz;
		fTangent = normalize( mulVec( uModelInverseTransposeLightMatrix, s.tangent ) );
		fBitangent = normalize( mulVec( uModelInverseTransposeLightMatrix, s.bitangent ) );
		fNormal = normalize( mulVec( uModelInverseTransposeLightMatrix, s.normal ) );
	#endif
	fColor = s.color;
	fTexCoord = s.texCoord;
}