BEGIN_INPUTS
	INPUT0(vec3,fPosition)
	INPUT1(vec4,fColor)
	INPUT2(vec3,fTangent)
	INPUT3(vec3,fBitangent)
	INPUT4(vec3,fNormal)
	INPUT5(vec4,fTexCoord)
END_INPUTS

BEGIN_OUTPUTS
	OUTPUT0(vec3,fPosition)
	OUTPUT1(vec4,fColor)
	OUTPUT2(vec3,fTangent)
	OUTPUT3(vec3,fBitangent)
	OUTPUT4(vec3,fNormal)
	OUTPUT5(vec4,fTexCoord)
END_OUTPUTS

GEOMETRY( TRIANGLES_IN, TRIANGLES_OUT, 3 )
{
	//placeholder/passthrough geometry shader,
	//we can do more interesting things here later. -jdr
	for( int i=0; i<3; ++i )
	{
		OUT(fPosition) = IN(fPosition,i);
		OUT(fColor) = IN(fColor,i);
		OUT(fTangent) = IN(fTangent,i);
		OUT(fBitangent) = IN(fBitangent,i);
		OUT(fNormal) = IN(fNormal,i);
		OUT(fTexCoord) = IN(fTexCoord,i);
		OUT_POSITION = IN_POSITION(i);

		EMIT_VERTEX;
	}
}