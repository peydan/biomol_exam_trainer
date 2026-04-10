#!/usr/bin/env python3
"""
Call Amazon Bedrock (Converse API) from the CLI.

Environment:
  AWS_REGION / AWS_DEFAULT_REGION — e.g. us-east-1
  BEDROCK_MODEL_ID — inference profile or model ID, e.g.:
    us.anthropic.claude-3-5-sonnet-20241022-v2:0
    anthropic.claude-3-haiku-20240307-v1:0

Credentials: standard AWS chain (env vars, ~/.aws/credentials, IAM role).

Enable the model in Bedrock console (Model access) for your account.
"""
import argparse
import os
import sys

import boto3
from botocore.exceptions import ClientError


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a prompt to AWS Bedrock via Converse.")
    parser.add_argument(
        "prompt",
        nargs="?",
        help="User message (omit to read stdin)",
    )
    parser.add_argument(
        "-m",
        "--model",
        default=os.environ.get("BEDROCK_MODEL_ID"),
        help="Model or inference profile ID (default: BEDROCK_MODEL_ID)",
    )
    parser.add_argument(
        "-r",
        "--region",
        default=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1",
        help="AWS region",
    )
    args = parser.parse_args()

    if not args.model:
        print(
            "Set BEDROCK_MODEL_ID or pass --model with your Bedrock model ID.",
            file=sys.stderr,
        )
        return 2

    prompt = args.prompt
    if prompt is None:
        prompt = sys.stdin.read()
    prompt = prompt.strip()
    if not prompt:
        print("Empty prompt.", file=sys.stderr)
        return 2

    client = boto3.client("bedrock-runtime", region_name=args.region)

    try:
        response = client.converse(
            modelId=args.model,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 4096, "temperature": 0.5},
        )
    except ClientError as e:
        print(e, file=sys.stderr)
        return 1

    message = response.get("output", {}).get("message", {})
    blocks = message.get("content", [])
    texts = [b["text"] for b in blocks if isinstance(b, dict) and "text" in b]
    sys.stdout.write("".join(texts))
    if texts:
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
