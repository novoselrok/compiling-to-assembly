#!/bin/bash

TEST_PROGRAM="test-programs/$1"
TMP_BINARY="/tmp/test-binary"

./compile.sh $TEST_PROGRAM $TMP_BINARY

OUTPUT=$(exec $TMP_BINARY)

if [[ $OUTPUT =~ ^\.+$ ]]; then
  echo "PASS $TEST_PROGRAM"
else
  echo "FAIL $TEST_PROGRAM"
fi
