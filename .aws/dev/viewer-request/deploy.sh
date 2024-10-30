#!/bin/sh -x

aws --profile surreal cloudfront describe-function --name dev-surrealist-app-viewer-request > temp.json
ETAG=$(jq -r '.ETag' temp.json)
aws --profile surreal cloudfront update-function --name dev-surrealist-app-viewer-request --function-code fileb://index.js --function-config Comment="",Runtime="cloudfront-js-2.0" --if-match $ETAG > temp.json
ETAG=$(jq -r '.ETag' temp.json)
aws --profile surreal cloudfront publish-function --name dev-surrealist-app-viewer-request --if-match $ETAG > temp.json
rm -rf temp.json
