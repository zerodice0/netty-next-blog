---
title: 'Spawn-fcgi의 크로스 컴파일에 대하여'
Category: Android
author: 'BlackBear'
---

# Spawn-fcgi의 크로스 컴파일에 대하여
spawn-fcgi는 nginx에서 다른 라이브러리를 사용하지 않고 fcgi를 돌릴 때 필요한 아이로, fcgi를 프로세스 단위로 실행해주는 녀석이다. 이 녀석을 사용하여 fcgi를 실행한 뒤, nginx에서 proxy-pass해주면 fcgi를 이용하여 통신하는 것이 가능해진다.

OpenResty/NGINX를 크로스 컴파일 할 때와 마찬가지로, QEMU나 Scratchbox와 같은 툴로 에뮬레이터 환경을 구축한 뒤 컴파일하면 아무런 설정 없이 컴파일이 가능하다. Scratchbox와 QEMU에 대해서는 OpenResty/NGINX의 크로스 컴파일 할 때 알아봤으므로, 이번에는 설명을 생략하도록 하겠다.

# configure를 통한 설정
Scratchbox와 QEMU를 사용할때는 소스코드의 위치로 이동하여, `configure`를 실행하면 간단하게 설정이 끝난다. prefix의 설정이 필요한 경우에는, `-prefix=` 파라메터를 통해 전달해주도록 한다. 이후 `make install`을 실행하여 설치하거나, `make install DESTDIR=$DESTDIR`을 실행하여 설치해주면 된다.

만약 Scratchbox나 QEMU를 사용할 수 없는 경우에는, configure를 실행할 때 `--host` 파라메터를 통해 컴파일 명령어를 넘겨준다. `LDFLAG` 환경변수에 타겟 칩셋의 `lib`경로를, `CFLAGS` 환경변수에 타겟 칩셋의 `include`경로를 넘겨주자. 타겟 칩셋의 컴파일러는 `CC`환경변수로 지정해주면 된다.

매번 이 값들을 입력해주기엔 입력해야하는 문자열의 길이가 많으므로, 쉘 스크립트를 사용하여 작성해주면 편하다. 아래는 위의 내용을 토대로 작성한 쉘 스크립트 파일의 내용이다.

```
export LDFLAGS="-L<COMPILER의 LIB 경로>"
export CFLAGS="-I<COMPILER의 INCLUDE 경로>"
export CC="<COMPILER의 경로>/arm-hisiv400-linux-gnueabi-gcc"
export CPP="<COMPILER의 경로>/arm-hisiv400-linux-gnueabi-cpp"
DESTDIR=$(pwd)/out

./configure --prefix=/NFDVR/webra/nginx \
            ac_cv_func_malloc_0_nonnull=yes \
            --host="-g -fsigned-char -march=armv7-a -mtune=cortex-a9 -ftree-vectorize -fno-builtin -fno-common" \
```

configure의 실행이 완료됐다면, `make install` 혹은 `make install DESTDIR=$DESTDIR`를 통해 설치하도록 하자.

### undefined reference to 'rpl_malloc', 'rpl_realloc'
spawn-fcgi에서 malloc과 realloc을 참조할 때, 설정에 따라서 `rpl_malloc` 혹은 `rpl_realloc`을 참조하는 경우가 있다. 이 때 `rpl_malloc`, `rpl_realloc`을 찾지 못하는 경우 위와 같은 에러가 발생하게 된다.

이 경우에는 `configure`를 실행할 때 `ac_cv_func_malloc_0_nonnull=yes` 혹은 `ac_cv_func_realloc_0_nonnull=yes`을 넘겨주도록 하자. 반드시 둘 다 넘겨줄 필요는 없고, `rpl_malloc`에 대한 에러가 발생했다면 `ac_cv_func_malloc_0_nonnull`만 추가해줘도 된다.

### automake: Unescaped left brace in regex is deprecated, passed through in regex
오래된 서버에서 빌드하는 경우, 위처럼 automake를 실행하는 도중 `{`와 관련된 에러가 발생하는 경우가 있다. perl과 automake의 버전 충돌에 의해 발생하는 이슈인데, automake와 perl의 버전을 업데이트하고 다시 시도해보도록 하자.

정 안된다면 오류가 발생하는 c파일을 열어서, `{`를 `\{`로 변경해주면 에러가 발생하지 않는다. 하지만 이것이 제대로 된 해결책인지는 확인이 필요하다.

### 바이너리 파일이 생성되지 않는 경우
위와 같은 과정을 거쳐서 `make install`을 실행하고 난 뒤, 설치 경로에 바이너리 파일이 생성되지 않는 경우가 있다. 이 경우에는 `src`를 살펴보면 바이너리 파일이 생성되어있을텐데, 설치하면서 출력되는 문구들 중에 에러가 발생하지 않았는지 확인해보도록 하자.

에러가 없다면 `src`의 바이너리 파일을 복사하여 직접 옮겨주면 된다.