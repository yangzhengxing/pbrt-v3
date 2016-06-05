BEGIN_PARAMS
	#ifdef CPR_OPENGL
	INPUT0(float,unused)
	#endif
END_PARAMS
{
	//no-op, logic is in geometry shader
	OUT_POSITION = vec4(0.0,0.0,0.0,1.0);
}