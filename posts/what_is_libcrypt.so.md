---
title: 'libcrypt.so(crypt 라이브러리)에 대하여'
Category: Android
author: 'BlackBear'
---

# libcrypt.so(crypt 라이브러리)에 대하여
이전에 OpenResty(NGINX)를 크로스컴파일하는 과정을 기록한 글에서, 글의 말미에 libcrypt.so에 관련된 내용을 잠깐 기록했었다. 별도의 글을 남기는 이유는 라이브러리 자체가 특정 서버에만 영향을 끼치는 게 아니며, 리서치 시 glibc의 libgcrypt.so, openssl의 libcrypto.so등 비슷한 라이브러리로 인해 파악이 어려웠기 때문이다. 간략하게 libcrypt.so에 대해 알아보자.

# Crypt 라이브러리
crypt 라이브러리를 구글에서 검색해보면, [위키피디아의 crypt(c)](https://en.wikipedia.org/wiki/Crypt_(C))페이지가 나온다. 페이지 상단의 몇 줄을 읽어보면, 비밀번호 해쉬값 생성시 사용되는 녀석임을 알 수 있다. 이제 왜 이 녀석이 없으면 `HTTP_AUTH_BASIC` 모듈을 사용할 수 없는지 대충 짐작할 수 있을 것이다. NGINX뿐만 아니라 lighttpd에서도 `MOD_AUTH`를 사용할 수 없다. 물론 요즘에는 `BASIC/DIGEST 인증`을 사용하지 않는 경우가 많기 때문에, 굳이 알 필요는 없겠지만 말이다.

추가적으로 `HTTP_AUTH_BASIC`처럼 특정 경로에 대한 인증 절차를 필요로 하지 않는다면, crypt 라이브러리가 없더라도 기능상 문제될 게 전혀 없다. `HTTP_AUTH_BASIC` 모듈은 특정 경로에 대한 접근을 제어하기 위해서만 사용되므로, 그 외의 기능은 정상적으로 사용 가능하다.

# LIBC?
보통의 경우에는 libc에 포함되어있어서, 크게 신경쓰지 않아도 되는 라이브러리 중에 하나이다. libc에 대해서는 [wariua/manpages-ko](https://github.com/wariua/manpages-ko/wiki/libc(7))에 잘 설명되어있다. 간략하게 `표준 C라이브러리`라는 것만 알고있으면 된다. libcrypt나 crypt로 검색해서 crypt 라이브러리에 대한 내용을 찾기는 어려운 반면, libc는 꽤 정확하게 필요하는 내용이 나온다. [위키백과 표준 C 라이브러리](https://ko.wikipedia.org/wiki/C_%ED%91%9C%EC%A4%80_%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC)에도 그 내용이 잘 정리되어있으니, 흥미가 있다면 한번쯤 읽어보자.

glibc나 uClibc 등 여러가지의 버전이 존재한다. 지금껏 임베디드 개발을 하면서 전달받은 SDK 내부에는 대부분 libc를 비롯해서 libcrypt.so가 포함되어있었기에, 일반적으로는 crypt 라이브러리가 포함되어있다고 얘기했었다. 하지만 일부 리눅스 시스템에서는 기본적으로 들어있지 않은 경우가 있다. 이런 경우에는 [GNU C library](https://www.gnu.org/software/libc/)를 통해 소스코드를 받은 뒤, 컴파일하여 crypt 라이브러리를 비롯한 C library 파일들을 얻을 수 있다.

[GNU C library](https://www.gnu.org/software/libc/)의 빌드 결과물은 모두 libg-로 시작되는 것으로 잘못 알고있는 경우도 있는데, 빌드 결과물을 살펴보면 알겠지만 그렇지 않다. 아마 libcrypt.so와 libgcrypt.so로 인한 착각이 아닐까싶다. 참고로 libgcrypt는 [GNU Pravacy Guard](https://en.wikipedia.org/wiki/GNU_Privacy_Guard)의 라이브러리 중 하나이다.

# CROSS-COMPILE?
크로스 컴파일은 어렵지 않게 가능하다. 단순히 configure파일에 --host 파라메터로 크로스 컴파일 타겟만 지정해주면 된다. 다만 configure파일이 있는 위치에서 바로 실행하면 다음과 같은 에러가 발생하게 된다.
> configure: error: you must configure in a separate build directory

configure 파일이 위치한 곳에서 실행하면 안되고, 별도의 디렉토리에서 실행하라는 얘기다. build 폴더를 만든 뒤, `../configure`와 같이 커맨드라인을 입력하여 실행하도록 하자. 몇번의 시행착오가 걸릴 것 같아서 쉘 스크립트를 만들었지만, 한번에 설정 및 컴파일이 완료된다.

```
../configure --disable-static \
            --prefix="/usr/lib/" \
            --host="arm-hisiv400-linux"
```

configure를 실행하기 전에 `CFLAGS`와 `LDFLAGS`를 지정해줘야 할 필요가 있다면, `export`를 통해 환경변수에 등록해주고 실행하면된다. 빌드 타이밍에만 필요한 함수기때문에 `.bashrc`에 등록하는 것 보다, `../configure`를 실행하는 쉘 스크립트 파일에 작성해주는게 낫다.

`../configure`의 실행이 완료되면 실행한 경로에 소스 파일들의 복사 및 Makefile의 생성이 완료된다. 이후 `make`를 실행하면 빌드가 시작된다. 정상적으로 생성이 된다면 `make install DESTDIR=<설치경로의 full-path>`를 입력하여 설치하도록 하자. 특정 라이브러리만 필요한 경우라면 해당 라이브러리의 so파일과 h파일만 추출해도 된다.

당연하다면 당연한 얘기겠지만, 라이브러리를 설치한 이후에는 의존성이 있는 녀석들을 다시 컴파일해줘야한다. OpenResty의 경우 런타임에 crypt함수를 호출하기만 할 뿐이라, 참조만 가능하다면 다시 컴파일을 해줄 필요가 없기는 하다. 다만 libcrypt.so가 없는 상태에서 크로스 컴파일하는데 성공했다면 `HTTP_AUTH_BASIC`모듈을 사용하지 않고 컴파일했다는 얘기가 되므로, 해당 모듈을 사용하고 싶을 경우에는 크로스 컴파일을 다시 해줘야 한다.