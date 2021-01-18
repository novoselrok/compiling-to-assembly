#!/bin/bash

ARM_COMPILER=arm-linux-gnueabihf-gcc

INPUT_FILE=$1
OUTPUT_BINARY_FILE=$2
OUTPUT_ASSEMBLY_FILE="/tmp/temporary.s"

node out/index.js $INPUT_FILE $OUTPUT_ASSEMBLY_FILE || exit "Compilation failed"

exec $ARM_COMPILER -static $OUTPUT_ASSEMBLY_FILE -o $OUTPUT_BINARY_FILE -march=armv7ve
