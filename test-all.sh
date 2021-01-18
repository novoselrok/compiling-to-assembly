#!/bin/bash

for filename in test-programs/*.program; do
  ./test.sh $(basename $filename)
done
