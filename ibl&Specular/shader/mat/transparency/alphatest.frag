#include "data/shader/mat/state.frag"

uniform	float	uAlphaTestValue;
uniform float	uAlphaScale;

void	TransparencyAlphaTest( inout FragmentState s )
{
	s.albedo.a = saturate( s.albedo.a * uAlphaScale );
	HINT_FLATTEN
	if( s.albedo.a < uAlphaTestValue )
	{
		discard;
	}
}

#define	Transparency	TransparencyAlphaTest
