---
title: 'OpenResty, NGINX Cross-compile에 대하여'
Category: Android
author: 'BlackBear'
---

# OpenResty, NGINX Cross-compile에 대하여
임베디드 시스템에 OpenResty를 사용한 이후로, 칩셋이 변경될 때마다 크로스 컴파일을 다시 해줘야했다. 문제는 기반지식이 전혀 없는 상태인데다, 인수인계 문서의 거의 내용도 없었다. NGINX 자체를 크로스컴파일 하는 경우는 종종 있지만 OpenResty를 크로스컴파일하는 글은 찾기 어려웠다.

이전에도 작성했듯이 scratchbox2, qemu와 같은 툴로 환경을 설정해주면 간단하게 끝나는 일이다. 문제는 toolchain 형태로 제공되는 컴파일러의 경우, scratchbox2를 사용해서 환경설정을 하게되면 에러가 발생한다. 예를 들면 심볼릭 링크를 인식하지 못해서 컴파일러가 동작하지 않는다던가.

애석하게도 작년에 크로스컴파일을 마지막으로 더 이상 OpenResty를 크로스컴파일하기 위해 머리를 쥐어뜯을 일이 없으리라고 생각했지만, 이번에 작업하게 된 칩셋의 컴파일러를 사용하여 scratchbox2를 구성하고나니 에러가 발생했다. 처음 OpenResty를 크로스컴파일했던 것도 벌써 5년이 지났다. 그럼 이제 5년간 머리를 쥐어뜯은 내용을 기록해보고자 한다.

# Scratchbox2와 QEMU
QEMU는 리눅스에서 사용하는 하드웨어 가상머신의 일종으로, CPU를 에뮬레이팅해주는 기능을 한다. 그러니까 컴파일러를 비롯한 녀석들을 가지고 있다면, 컴파일러가 제공하는 명령셋을 기반으로 하는 하드웨어 환경을 에뮬레이팅할 수 있다는 이야기다. QEMU를 사용하면 크로스컴파일을 손쉽게 할 수 있는데, 해당 파일시스템이 실제 리눅스 머신인 것 마냥 동작하기 때문이다.

Scratchbox2는 QEMU를 좀 더 간단하게 사용할 수 있도록 도와주는 녀석이라고 보면 된다. CPU를 사용한 가상 하드웨어 환경을 구성해주지만, 호스트에 설치된 도구들도 사용할 수 있다. 파일시스템을 구축한 뒤 Scratchbox2로 초기화하면, 해당 파일시스템에 설치된 라이브러리들을 기반으로 호스트에 설치된 도구들을 사용하여 크로스컴파일이 가능하다는 이야기다.

구체적인 예시를 들어서 설명하면 Scratchbox2, QEMU를 사용한 크로스컴파일이 얼마나 편리한지 쌈빡하게 이해가 가능하다. 'BlackBearPy'라는 보드를 대상으로 크로스컴파일을 한다고 가정하자. 해당 파일시스템에 올릴 linux기반의 파일시스템이 `~/workspace/BlackBearPyFileSystem`에 저장되어있다면, 해당 위치로 이동해서 `sb2-init <alias> <compiler full-path>:<specs>`명령어로 Scratchbox2를 초기화해준다. 이제 `sb2 -t <alias>`를 실행하면, Makefile등을 사용해서 빌드할 때 `~/workspace/BlackBearPyFileSystem`경로에 설치된 라이브러리들을 참조하게된다. 만약 빌드에는 `Perl`이나 `Python`같은 녀석들이 필요한데, `~/workspace/BlackBearPyFileSystem`에는 설치되어있지 않다면? 그런 경우에는 호스트에 설치된 `Perl`이나 `Python`를 참조하게 된다.

파일시스템에 이것저것 설치되어있다면 아무래도 상관없는 이야기긴 하지만, `Perl`은 커녕 `make`도 없는 파일시스템을 대상으로 크로스컴파일을 하려면 Scratchbox2와 QEMU는 굉장히 유용한 녀석들이다. 특히 NGINX의 경우 autotool이 잘 되어있기 때문에, Scratchbox2와 QEMU를 사용하면 크로스컴파일하기 쉽다.

# Scratchbox2를 사용한 OpenResty의 빌드 방법
사실상 위에서 예시를 드는 과정에서 이미 다 설명이 끝난 얘기지만, 좀 더 보기쉽게 정리해보면 다음과 같은 과정을 거쳐서 OpenResty를 빌드할 수 있다.
1. 파일시스템을 준비한다.
2. 크로스컴파일의 대상이 되는 파일시스템의 경로로 이동하여, `sb2-init <alias> <compiler full-path>:<specs>`를 입력하자. `<specs>`는 옵션이므로 생략할 수 있다. [sb2-init](http://manpages.ubuntu.com/manpages/trusty/man1/sb2-init.1.html)에 대해서는 [링크](http://manpages.ubuntu.com/manpages/trusty/man1/sb2-init.1.html)를 참조하도록 하자.
3. `sb2 -t <alias>`를 입력하여 에뮬레이터를 실행한다.
4. `configure` 파일을 실행하여 OpenResty를 설정하고, make install을 호출하면 된다. scratchbox2를 실행한 상태에서도 호스트의 루트 파일시스템에 설치하려고 시도하니, 설치 경로를 지정해주려면 `make install DESTDIR=<paths>`와 같이 입력해주면 된다.
5. 기다리면 빌드와 설치가 완료된다! 파일시스템을 올리건 펌웨어를 만들건 실행시켜보자. 빌드가 정상적으로 됐다면, 문제없이 라이브러리를 실행할 수 있을 것이다.

# Scratchbox2, QEMU를 빌드할 수 없을 때의 OpenResty 빌드 방법
하이실리콘 칩셋을 사용한 환경이 늘어나서 그런지, 나처럼 머리를 뜯던 이가 또 있었나보다. 2019년에 작성된 [Cross-compiling nginx used on Hi3536](https://programmer.help/blogs/cross-compiling-nginx-used-on-hi3536.html)라는 제목의 글을 발견했는데, 에뮬레이터 환경이 없을 때 NGINX를 크로스컴파일하는 방법에 대한 내용이다. OpenResty는 NGINX와 친구들을 하나로 묶어놓은 라이브러리이기 때문에, 이 글을 참조하여 머리를 쥐어뜯던 손이 바야흐로 평화를 되찾을 수 있었다. 만약 NGINX만 빌드하려고 하는 경우에는, 이 글을 참조하여 작업하면된다.

### LuaJIT에서의 에러
LuaJIT에서는 msse를 지원하는 플랫폼인지 확인하는 과정에서, 에러가 한 번 출력되게 된다. configure시에 컴파일러에 -msse42명령을 지원하는지 테스트해보는데, 컴파일러에 따라서는 에러가 발생하는 것 뿐만 아니라 스크립트가 종료되기 때문이다. openResty의 configure파일을 열어서, -msse42 명령어를 테스트하는 구문을 주석처리 해주도록 하자.

LuaJIT을 빌드하다보면 minilua를 실행하지 못해서 에러가 발생한다. 이는 LuaJIT을 빌드하는 과정에서 minilua를 실행하려고 하는데, 크로스 컴파일러와 호스트 OS가 일치하지 않으면 실행할 수 없기 때문에 발생하는 에러다. 이 경우에는 CROSS 플래그를 사용하여 크로스 컴파일러의 PREFIX를 지정해주는 방법이 있는데, 만약 CFLAGS를 사용하고 있다면 `-mtune`이나 `-march`옵션을 minilua가 지원하지 않는 경우가 발생할 수 있다. 이런 경우에는 build/LuaJIT의 경로에서, LuaJIT을 따로 크로스컴파일하는 방법이 있다.

> make HOST_CC="gcc -m32"\
>  CROSS="`<CROSS COMPILER PATH>`/`<CROSS COMPILER PREFIX>`" \
>  TARGET_CFLAGS="`<CFLAGS>`"

나의 경우는 bundle/LuaJIT 디렉터리에 위와 같은 내용으로 make명령어를 실행시켜주는 쉘 스크립트를 추가했다. make를 실행해주는 명령어가 작성된 쉘 스크립트로, 오류없이 make의 실행이 끝나면 `make install DESTDIR=`을 통해 설치해주면 된다. 다만 이 경우에는 OpenResty에 포함된 LuaJIT이 아닌 상태로 인식되어, nginx를 실행할 때 일부 기능을 사용할 수 없다는 경고가 출력된다. 어지간하면 별도로 빌드하지 않도록 하자.

### NGINX에서의 에러
앞서 말했듯이 NGINX는 autotool을 사용하여 헤더 파일 및 define값들이 설정되기때문에, 에뮬레이터를 사용할 경우 큰 문제 없이 빌드가 가능하다. 하지만 에뮬레이터를 사용하지 않는다면? [Cross-compiling nginx used on Hi3536](https://programmer.help/blogs/cross-compiling-nginx-used-on-hi3536.html)에 기술된 내용의 에러들을 차례차례 만나게 될 것이다.

위 글에서는 빌드 과정에서 autotool로 생성되는 헤더파일을 직접 수정했지만, OpenResty의 경우 bundle의 내용을 build로 복사하여 빌드하기 때문에 원본 파일을 수정했다. 수정사항을 패치 파일로 만들어놓으면 좀 더 좋겠지만... 일단 패치까지는 제작하지 않았다.

configure부터 진행해보도록하자. 위의 [Cross-compiling nginx used on Hi3536](https://programmer.help/blogs/cross-compiling-nginx-used-on-hi3536.html)에서는 hisiv400으로 크로스컴파일을 진행하고 있는데, hisiv400은 scratchbox2가 잘 동작하므로 사서 고생하지 말자. 일단 이 글에선 링크와 동일한 설정을 사용하도록 하겠다.
```
./configure
--with-http_ssl_module
--with-cc=arm-hisiv400-linux-gcc
--with-cpp=arm-hisiv400-linux-cpp
--with-pcre=/home/src/pcre-8.42
--with-openssl=/home/src/openssl-OpenSSL_1_1_0i
--without-http_gzip_module
--without-http_upstream_zone_module
```

### 1. checking for C compiler ... found but is not working
```
checking for C compiler ... found but is not working
./configure: error: C compiler arm-hisiv400-linux-gcc is not found
```
configure중에 컴파일러를 찾았지만 동작하지 않는다는 에러가 발생한다. NGINX를 컴파일하는 중에, 컴파일한 프로그램들을 실행하려고 하기 때문에 발생하는 문제이다. 크로스컴파일 중에 해당 파일들이 실행되지 않도록 설정해주면 해당 에러를 해결할 수 있다. `auto/cc/name`을 열어서, `ngx_feature_run=yes`로 되어있는 라인을 `ngx_feature_run=no`로 수정해주자.
```
ngx_feature="C compiler"
ngx_feature_name=
ngx_feature_run=yes
==> ngx_feature_run=no
```

### 2. checking for int size ...objs/autotest: 1: objs/autotest: Syntax error: word unexpected (expecting ")")
```
checking for int size ...objs/autotest: 1: objs/autotest: Syntax error: word unexpected (expecting ")")
bytes
./configure: error: can not detect int size
```
역시 CC로 컴파일된 프로그램을 실행할 수 없기 때문에 발생하는 문제이다. `auto/type/sizeof`를 열어서 `$CC`를 `gcc`로, `ngx_size=`를 4로 변경해주자.
```
ngx_test="$CC $CC_TEST_FLAGS $CC_AUX_FLAGS \
   ==> ngx_test="gcc $CC_TEST_FLAGS $CC_AUX_FLAG \

if [ -x $NGX_AUTOTEST ]; then
    ngx_size=`$NGX_AUTOTEST`
   ==>    ngx_size=4
```

이제 configure 과정에서는 에러가 발생하지 않을 것이다. make를 수행해보자.

### 3. pcre: C compiler cannot create executables
```
cd /home/src/pcre-8.42
&& if [ -f Makefile ]; then make distclean; fi
&& CC="arm-hisiv400-linux-gcc" CFLAGS="--host=arm-hisiv400-linux -pipe"
./configure --disable-shared
...
configure: error: in `/home/src/pcre-8.42':
configure: error: C compiler cannot create executables
```
PCRE를 빌드할 때 nginx가 크로스컴파일 체인을 올바르게 설정해주지 않기 때문에 발생하는 에러다. `auto/options`를 열어서 다음과 같이 `PCRE_CONF_OPT`를 설정해주자. hisiv400을 타겟으로 크로스컴파일중이기에 `arm-hisiv400-linux`를 설정해주는 것이고, 설치된 컴파일러의 prefix를 넣어주면 된다.
```
PCRE_CONF_OPT=
  ==> PCRE_CONF_OPT=--host=arm-hisiv400-linux
```

### 4. ngx_atomic_cmp_set() is not defined
```
src/core/ngx_rwlock.c:125:2: error: #error ngx_atomic_cmp_set() is not defined!
```
에러가 발생한 소스코드를 따라가보면, 다음과 같은 플래그를 확인할 수 있다.
```
#if (NGX_HTTP_UPSTREAM_ZONE || NGX_STREAM_UPSTREAM_ZONE)
#error ngx_atomic_cmp_set() is not defined!
#endif
```
http upstream zone module과 stream upstream zone module 두 개의 모듈이 기본으로 포함되어있기 때문에 발생하는 에러인데, --without-http_upstream_zone_module을 confiure에 추가해준다. 나의 경우에는 http upstream zone module을 제외한 이후에도 stream upstream zone module이 동일한 문제를 발생시켰는데, --without-stream_upstream_zone_module을 추가해주고 configure를 다시 실행해주자 make 시 문제가 발생하지 않았다.

configure 옵션에 대해서는 [nginx configure 페이지](http://nginx.org/en/docs/configure.html)를 참조하도록 하자. `--without-http_upstream_zone_module`, `--without-stream_upstream_zone_module`를 설정해주면, 업스트림 그룹의 런타임 상태를 공유 메모리 영역에 저장할 수 없게 된다.

### NGX_SYS_NERR undecleared
```
src/os/unix/ngx_errno.c: In function 'ngx_strerror':
src/os/unix/ngx_errno.c:37:31: error: 'NGX_SYS_NERR' undeclared (first use in this function)
msg = ((ngx_uint_t) err < NGX_SYS_NERR) ? &ngx_sys_errlist[err]:
```

크로스컴파일러가 실행되는 중에 `NGX_SYS_NERR` 메크로를 참조하지 못하기 때문에 발생하는 문제다. 원문에서는 `objs/ngx_auto_config.h`에 `NGX_SYS_NERR`값을 추가하라고 되어있다. bundle에서 원문을 수정하는 경우에는 `src/core/ngx_config.h`에 `NGX_SYS_NERR`값을 추가해주도록 하자.
```
#ifndef NGX_SYS_NERR
#define NGX_SYS_NERR  132
#endif
```

### openSSL: File Format not recognized
```
/home/src/openssl-OpenSSL_1_1_0i/.openssl/lib/libssl.a: error adding symbols: File format not recognized
collect2: error: ld returned 1 exit status
objs/Makefile:236: recipe for target 'objs/nginx' failed
```
openSSL을 빌드할 시 크로스컴파일러의 gcc가 아닌, 호스트의 gcc를 호출했기 때문에 발생하는 문제이다. `auto/lib/openssl/make`의 내용을 다음과 같이 수정해주도록 하자.
```
&& ./config --prefix=$ngx_prefix no-shared no-threads $OPENSSL_OPT \
  ==> && ./Configure --prefix=$ngx_prefix no-shared no-threads --cross-compile-prefix=arm-hisiv400-linux- linux-generic32 \
```

### undefined reference to 'ngx_shm_alloc', undefined reference to 'ngx_shm_free'
```
objs/src/core/ngx_cycle.o: In function 'ngx_init_cycle':
/home/src/nginx-1.14.0/src/core/ngx_cycle.c:476: undefined reference to 'ngx_shm_alloc'
/home/src/nginx-1.14.0/src/core/ngx_cycle.c:685: undefined reference to 'ngx_shm_free'
```
위에서 기재한 `NGX_SYS_NERR`와 마찬가지로, `NGX_HAVE_SYSVSHM` 매크로를 참조하지 못하기 때문에 발생하는 문제다. 원문에서는 `objs/ngx_auto_config.h`에 `NGX_SYS_NERR`값을 추가하라고 되어있다. bundle에서 원문을 수정하는 경우에는 `src/core/ngx_config.h`에 `NGX_SYS_NERR`값을 추가해주도록 하자.

```
#ifndef NGX_HAVE_SYSVSHM
#define NGX_HAVE_SYSVSHM 1
#endif
```

### undefined reference to 'coctx'
로컬에서 `ngx_stream_lua_socket_tcp.c` 파일을 빌드할 때 외부에 선언된 `coctx`값을 extern 키워드로 불러와서 출력하려고 하는데, 빌드 시점에 해당 값을 참조하지 못하므로 발생하는 에러다. `ngx_stream_lua_socket_tcp.c` 내에서 에러가 발생하는 구문은 `dd("coctx:%p", coctx)`로 디버그 문구를 출력하는 구문이다. 주석처리하면 에러가 발생하지 않는다.

`ngx_stream_lua_socket_tcp.c`는 `nginx/src`가 아닌 `ngx_stream_lua-0.0.7/src`에 위치해있으니, 참고하도록 하자.

### undefined reference to 'ngx_aio_ctx', undefined reference to 'ngx_eventfd'
configure 시점에 `--with-file-aio` 파라메터를 추가했을 때 발생할 수 있는 에러다. 역시 [nginx configure 페이지](http://nginx.org/en/docs/configure.html) 페이지에서 찾아볼 수 있는데, FreeBSD, Linux에서 지원하는 [Asynchronouse file I/O](http://nginx.org/en/docs/http/ngx_http_core_module.html#aio)를 지원하지 않아서 발생하는 에러다. 플래그를 제거해주자.

# 빌드 완료! Make install을 해주자.
위의 과정을 거치고나면 Make까지 별 이상없이 동작하는 것을 확인할 수 있을 것이다. 만약 위에서 기술한 내용 이외의 에러가 발생할 경우, configure나 에러가 발생하는 소스코드를 확인하여 해결하도록 하자. 차근차근히 보다보면 대부분은 해결되더라(...)

make install을 시도하면 호스트의 루트에 설치를 시도하므로, `DESTDIR=<path>` 파라메터를 추가하여 설치될 경로를 지정해주도록 하자. 이제 남은 것은 실제 파일시스템에서 크로스컴파일 된 결과물을 실행시켜보는 것 뿐이다 ' ㅅ')!

# nginx 실행시의 오류.
### libcrypt.so.1: cannot open shared object file
우선 `/usr/lib`에 `libcrypt.so`가 있는지 확인해보자.(OpenSSL의 `libcrypto.so`가 아니다.) <s>이 녀석은 암호화를 일반적으로 리눅스 시스템이면 가지고 있는 암호화 라이브러로, nginx는 기본적으로 사용자 생성시 사용자 파일을 암호화할때 이 라이브러리를 사용한다.</s> nginx에서 특정 경로에 대한 접근 제어를 할 때, 사용자의 Salt값을 생성하기 위해 사용된다. 이 에러가 출력된다는 건 `HTTP_AUTH_BASIC 옵션`은 YES로 활성화되어있지만, 실제 파일시스템에서는 `crypt 라이브러리`를 지원하지 않아서 발생하는 문제이다.

nginx가 automake를 통해 Makefile을 생성하는 과정에서 `auto/options`를 참조하게 되므로, 이 파일을 수정해주면 된다. `auto/options`를 열어서 `HTTP_AUTH_BASIC 옵션`을 NO로 설정해주자. 이 경우에는 `basic_auth`를 사용하여 특정 경로에 대한 접근제어를 할 수 없게되므로, 주의하도록 하자. 물론 서버의 root 경로를 지정하고 해당 경로 이하에 보안과 직결되는 파일을 저장하지만 않는다면, 딱히 문제가 되지 않는 요소기는 하다. <s>애사딩초 `libcrypt.so`가 없는 경우도 잘 없기는 하다.</s>

libcrypt.so에 대한 내용은 다음의 글에서 정리하기로 한다.

> 참조 \
> [Cross-compiling nginx used on Hi3536](https://programmer.help/blogs/cross-compiling-nginx-used-on-hi3536.html) \
> [Ubuntu manual page: sb2-init](http://manpages.ubuntu.com/manpages/trusty/man1/sb2-init.1.html)를 참조하도록 하자.