#include "data/shader/mat/state.frag"
#include "fresnel.frag"
#include "ssraytrace.frag"

USE_TEXTURE2D(tScreenNoise);

uniform vec4	uScreenNoiseScaleBias;

void	ReflectionBlinnPhong( inout FragmentState s )
{
	//fade out for normals that point away from the eye
	//(since reflected ray will probably just trace onto the starting point)
	float EdotN = dot( s.vertexEye, s.normal );
	float fade = saturate( EdotN*32.0 - (1.0/32.0) );

	//fade out for reflections pointing near the camera
	fade *= saturate( 5.0 - 5.5*EdotN );

	//determine specular exponent from gloss map & settings
	float specExp = -10.0 / log2( s.gloss*0.968 + 0.03 );
	specExp *= specExp;

	//check and see if our fade has allowed us to proceed
	vec2 hitCoords = vec2(0.0, 0.0);
	float hitMask = 0.0;
	HINT_BRANCH
	if( fade > 0.0 )
	{
		//basis for probability orientation
		vec3 basisX = normalize( cross( s.normal, vec3(0.0, 1.0, saturate(s.normal.y*10000.0 - 9999.0) ) ) );
		vec3 basisY = cross( basisX, s.normal );
		vec3 basisZ = s.normal;
		
		//half vector is taken at random from probability distribution
		vec2 tc = s.screenTexCoord*uScreenNoiseScaleBias.xy + uScreenNoiseScaleBias.zw;
		vec4 r = texture2DLod( tScreenNoise, tc, 0.0 ); //{ r1, r2, cos(2*pi*r2 ), sin( 2*pi*r2 ) }
		r.zw = r.zw*2.0 - vec2(1.0,1.0);
		r.zw = normalize( r.zw );
		float cos_theta = pow( r.x, 1.0 / (specExp + 1.0) );
		float sin_theta = sqrt( 1.0 - cos_theta*cos_theta );
		float cos_phi = r.z;
		float sin_phi = r.w;
		vec3 h = vec3( cos_phi*sin_theta, sin_phi*sin_theta, cos_theta );
		h = h.x*basisX + h.y*basisY + h.z*basisZ;

		//get reflection vector from half vector
		vec3 dir = reflect( -s.vertexEye, h );

		//trace the ray
		traceRay( s.vertexPosition, dir, hitCoords, hitMask );
		hitMask *= fade;
	}

	//find reflectivity
	float glossAdjust = s.gloss*s.gloss;
	vec3 reflectivity = s.reflectivity, fresn = s.fresnel;
	reflectivity = fresnel(	dot( s.vertexEye, s.normal ),
							reflectivity,
							fresn * glossAdjust	);

	//done
	s.output0.xy = hitCoords;
	s.output1.xyz = hitMask * reflectivity;
	s.output1.w = 1.0 - hitMask;
}

#define	Reflection	ReflectionBlinnPhong