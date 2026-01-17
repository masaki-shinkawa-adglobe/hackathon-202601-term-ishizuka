FROM python:3.12-alpine

WORKDIR /app

# numpy/pandas を "ソースから作る" ことになった時に必要な道具一式
# + uvicorn[standard] 用の依存
RUN apk add --no-cache \
    build-base \
    musl-dev \
    linux-headers \
    python3-dev \
    pkgconfig \
    gfortran \
    openblas-dev \
    lapack-dev \
    libffi-dev \
    openssl-dev \
    libuv-dev

# PATH_MAX/realpath 周りで詰まることがあるので、念のため
RUN apk add --no-cache musl-utils

# pip周りを新しくする（ビルド成功率UP）
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app /app/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]