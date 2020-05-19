---
title: 'Android의 findViewById로 알아보는 Kotlin의 고차 함수와 제네릭 함수'
Category: Android
author: 'BlackBear'
---

# Android의 findViewById로 알아보는 Kotlin의 고차 함수와 제네릭 함수
Android에는 XML로 작성한 레이아웃으로부터 View를 불러오는 `findViewById(int id)`가 있다. 매번 뷰를 불러올 때마다 입력해야하기 때문에 말도 많고, 실제로 입력하지 않기 위해 버터나이프나 Kotlin의 synthetics 등의 라이브러리도 만들어졌다. 가장 큰 이유는 `Button`에 클릭에 대한 이벤트 리스너 하나만 등록해주려고 해도, `findViewById<Button>(R.id.button).setOnClickEventListener {}` 처럼 긴 코드를 작성해야 하기 때문일 것이다. 여기서는 단순히 id가 button이기 때문에 그다지 길어보이지 않지만, 한 눈에 어떤 역할을 담당하고 있는 버튼인지 눈에 띄는 id를 사용한다면 어떨까? 물론 사람에 따라서 호불호가 갈리는 주제일 수 있겠지만, Button버튼의 이름을 `sign_up_with_facebook_id`로 지었다고 치자. 이 버튼에 클릭 이벤트 리스너를 할당하는 코드는 아래와 같다.

```
findViewById<Button>(R.id.sign_up_with_facebook_id).setOnClickEventListener {
  ...
}
```
길다...! 버튼이 좀 여러개이고, 단순히 이벤트 리스너를 할당하는 것 외에 별다른 동작을 하지 않는다고 가정해보자. 위의 `sign_up_with_facebook_id`가 페이스북 ID를 통해서 서비스에 가입을 요청하는 버튼이라는 걸 알 수 있다. 그렇다면 예를 들어서, 네이버, 구글, 카카오 ID를 통해서 서비스에 가입을 요청하는 버튼과, 이미 가입되어있는 ID와 PW를 이용해서 가입을 요청하는 버튼이 있다고 가정해보자. 

```
findViewById<Button>(R.id.sign_up_with_facebook_id).setOnClickEventListener {
  ...
}

findViewById<Button>(R.id.sign_up_with_google_id).setOnClickEventListener {
  ...
}

findViewById<Button>(R.id.sign_up_with_naver_id).setOnClickEventListener {
  ...
}

findViewById<Button>(R.id.sign_up_with_kakao_id).setOnClickEventListener {
  ...
}

findViewById<Button>(R.id.sign_up_with_id_and_password).setOnClickEventListener {
  ...
}
```

길이도 길이지만 코드가 길어지면서, 라인이 한 눈에 들어오지 않는다는 것도 문제다. 물론 노련한 개발자라면 `findViewById`에 넘겨주는 id와 `setOnClickEventListener`만 보고도 '음, 이건 어떤 서비스의 ID를 통해 회원가입을 요청하는 버튼의 실제 동작이겠군!'하고 결론을 내릴지도 모른다. 하지만 나는 그런 노련한 개발자는 되지 못하기 때문에, '반복되는 `findViewById`와 `setOnClickEventListener`만 하나로 합치면, 좀 가독성을 올릴 수 있지 않을까?'라는 생각을 하는 것이다. <s>(그냥 Kotlin synthetics써라)</s>

> Kotlin synthetics는 View의 id만 가지고 View에 대한 동작을 처리할 수 있기에 편리한 것은 분명하다. 하지만 개인적으로는 findViewById를 사용하는 쪽을 좀 더 선호하는데, Kotlin synthetics의 경우 Smart typecasting으로 인해 참조하는 View가 정확히 어떤 녀석인지 파악이 어렵다는 점 때문이다. 물론 id를 `button_sign_up_with_facebook_id`처럼 짓는다면, '아, 페이스북 ID를 통해 가입을 처리하는 버튼이구나!'하고 추론할 수 있기는 하다. 하지만 알고보니 `ImageButton`이었다거나, 아니면 버튼 모양으로 만들어놓은 다른 View을 `Button`처럼 사용하고 있었다면...? 
>
> 아마 큰 문제는 없을것이다. 기껏해야 예외가 발생하거나 혹은 특정 메서드나 프로퍼티를 사용하지 못해서 '뭐야 이거 왜 안돼?'라고 레이아웃을 까본 뒤에 배신감을 느끼는 정도겠지만, 개인적으로는 그런 류의 문제로 인해 Kotlin synthetics를 사용하기 보다는 findViewById를 통해서 View의 타입을 명시해주는 쪽을 더 선호한다. 일반적인 이야기가 아니라 개인의 취향에 대한 내용이므로, 크게 신경쓸 필요는 없다.

## findViewById와 setOnClickEvnetListener를 추상화해보자.
자, 우선 고차함수(higher-order function)에 대해 알아보기 위해 Kotlin docs의 [Higher-Order Functions and Lambdas](https://kotlinlang.org/docs/reference/lambdas.html) 페이지에서 고차함수에 대한 내용을 살펴보자. `setOnClickEvnetListener`에 넘겨주는 람다는 View인자를 받아서 Unit을 반환하므로, `(View) -> Unit`으로 표현할 수 있다. 또한 `setOnClickEventListener`는 View의 메소드이므로, 인자로 전달된 id 대해 `findViewById`를 호출해서 `setOnClickEventListener`로 이벤트 리스너를 등록하는 함수는 다음과 같이 작성할 수 있다.

```
fun attachClickListenerToView(viewId: Int, listener: (View) -> Unit) = run {
  findViewById<View>(viewId).setOnClickListener(listener)
}
```
이제 `attachClickListenerToView()`를 사용하면코드의 길이를 좀 줄일 수 있다. 위에서 작성한 `findViewById.setOnClickEventListener()`를 모두 `attachClickListenerToView()`로 변경해보자.

```
attachClickListenerToView(R.id.sign_up_with_facebook_id) {
  ...
}

attachClickListenerToView(R.id.sign_up_with_google_id) {
  ...
}

attachClickListenerToView(R.id.sign_up_with_naver_id) {
  ...
}

attachClickListenerToView(R.id.sign_up_with_kakao_id) {
  ...
}

attachClickListenerToView(R.id.sign_up_with_id_and_password) {
  ...
}
```
좋아, 이걸로 조금 코드가 단순해졌다. 함수 이름을 보고 어떤 id에 클릭에 대한 이벤트 리스너를 등록한다는 것은 쉽게 파악할 수 있다. 하지만 항상 View에 대해서만 등록하는 것은 조금 꺼림찍하다. 예를 들어서 `ImageButton`를 클릭했을 때 View의 이미지를 변경해준다던가, 혹은 `CheckBox`를 클릭했을 때 체크되어있는지 확인하고싶다면...? `attachClickListenerToView()`를 호출할때 넘겨주는 람다의 it은 View이므로, it을 `ImageButton`이나 `CheckBox`로 타입캐스팅하는 수밖에는 없다.

```
attachClickListenerToView(R.id.checkbox) {
  if ((it as CheckBox).isChecked) {
    ...
  }
}

attachClickListenerToView(R.id.imagebutton) {
  (it as ImageButton).setImageResource(
    when (it.isSelected) {
      true -> R.drwable.icon_on
      false -> R.drawable.icon_off
    }
  )
}
```
아무래도 타입캐스팅을 사용하는 것은 개발자의 실수로 인해 `TypeCastException`가 발생할 소지도 있다. 또한 위에서 Kotlin synthetics을 선호하지 않는 이유에 대해서 언급했듯이, 개인적으로는 타입이 명시되지 않는 상황이 썩 유쾌하지는 않다. 제네릭 함수(Generic function)를 사용해서 `attachClickListenerToView`에 타입을 명시해주도록 해보자.

```
fun <V> attachClickListenerTo(viewId: Int, listener: (View) -> Unit) {
  findViewById<V>(viewId).setOnClickListener(listener)
}
```
> kotlin type argument is not within its bounds. \
> Expected: View! \
> found: T!

위와 같이 작성하면 `타입 파라메터 V`를 받아서, `findViewById`를 호출하여 얻은 V의 객체에 `setOnClickListener`를 호출해줄 수 있을 것이다. 하지만 이렇게 작성하면 Android Studio에서 빨간색 밑줄과 함께 에러가 발생했음을 알려준다. 이는 findViewById의 정의를 보면 알 수 있는데, Java의 와일드카드로 타입의 범위가 View로 제한되었기 때문이다.

Kotlin에서 이를 어떻게 사용하는지를 확인하려면, Kotlin docs의 [Higher-Order Functions and Lambdas](https://kotlinlang.org/docs/reference/lambdas.html)의 Generic constraints 항목을 읽어보도록 하자. 기본적으로 타입 파라메터의 상한(Upper bound)은 `Any?`이다. 상한을 2개 이상 지정할 경우에는 `where`를 사용해야한다. `attachCklickListenerTo`의 상한은 View 1개면 충분하므로, 다음과 같이 상한을 지정해주도록 하자.

```
fun <V: View> attachClickListenerTo(viewId: Int, listener: (View) -> Unit) {
  findViewById<V>(viewId).setOnClickListener(listener)
}
```