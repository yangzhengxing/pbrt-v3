#include "data/shader/mat/state.frag"
#include "fresnel.frag"
#include "ssraytrace.frag"

void	ReflectionMirror( inout FragmentState s )
{
	//fade out for normals that point away from the eye
	//(since reflected ray will probably just trace onto the starting point)
	float EdotN = dot( s.vertexEye, s.normal );
	float fade = saturate( EdotN*32.0 - (1.0/32.0) );

	//fade out for reflections pointing near the camera
	fade *= saturate( 3.0 - 3.5*EdotN );

	//check and see if our fade has allowed us to proceed
	vec2 hitCoords = vec2(0.0, 0.0);
	float hitMask = 0.0;
	HINT_BRANCH
	if( fade > 0.0 )
	{
		//find view-space reflection vector
		vec3 r = reflect( -s.vertexEye, s.normal );

		//trace the ray
		traceRay( s.vertexPosition, r, hitCoords, hitMask );
		hitMask *= fade;
	}

	//find reflectivity
	vec3 refl = fresnel(	dot( s.vertexEye, s.normal ),
							s.reflectivity,
							s.fresnel	);

	//done
	s.output0.xy = hitCoords;
	s.output1.xyz = hitMask * refl;
	s.output1.w = 1.0 - hitMask;
}

#define	Reflection	ReflectionMirror