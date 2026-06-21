#include <iostream>
#include <string>
#include <sstream>
#include <map>
#include <vector>
#include <cstdlib>
using namespace std;
class HakimiEngine {
public:
    HakimiEngine() : lang("中文"), state(0) {
        initTexts();
    }
    void setLanguage(const string& l) { lang = l; }
    vector<string> processInput(const string& input);
    string getMainMenu();
    string getWelcome() { return t("welcome"); }
    int getState() const { return state; }
private:
    string lang;
    int state;
    map<string, map<string, string>> texts;
    void initTexts();
    string t(const string& key);
};
void HakimiEngine::initTexts() {
    texts["中文"] = {
        {"menu0", "请选择功能："},
        {"menu1", "1) hakimi 加法小程序"},
        {"menu2", "2) hakimi学你说话"},
        {"menu3", "3) 退出"},
        {"menu4", "4) 清空对话"},
        {"promptAdd", "告诉我你有多少个hakimi? "},
        {"addResult1", "现在你太有hakimi了 我给你114514个"},
        {"addResult2", "所以你有 "},
        {"addResult3", " 个hakimi了"},
        {"addFooter", "智障hakimi小程序 by卢本伟 去吧小子"},
        {"echoIntro", "我学你说话（输入内容将被回显）。输入 \":q\" 或 \"exit\" 或单独的 \"q\" 返回主菜单。"},
        {"exitEcho", "返回主菜单..."},
        {"exitProgram", "退出程序..."},
        {"invalidOption", "无效选项，请重试。"},
        {"inputError", "输入无效，请输入一个整数。"},
        {"welcome", "欢迎使用 hakimi 控制台！请从下方菜单选择功能。"},
        {"clearChat", "对话已清空。"}
    };
    texts["English"] = {
        {"menu0", "Please select a function:"},
        {"menu1", "1) hakimi addition program"},
        {"menu2", "2) hakimi repeats what you say"},
        {"menu3", "3) Exit"},
        {"menu4", "4) Clear chat"},
        {"promptAdd", "Tell me how many hakimi do you have? "},
        {"addResult1", "Now you have too many hakimi, I give you 114514 more"},
        {"addResult2", "So now you have "},
        {"addResult3", " hakimi"},
        {"addFooter", "Stupid hakimi program by Lu Benwei, go ahead kid"},
        {"echoIntro", "I will repeat what you say. Type \":q\", \"exit\" or \"q\" to return to the main menu."},
        {"exitEcho", "Returning to the main menu..."},
        {"exitProgram", "Exiting the program..."},
        {"invalidOption", "Invalid option, please try again."},
        {"inputError", "Invalid input, please enter an integer."},
        {"welcome", "Welcome to hakimi console! Choose an option from the menu below."},
        {"clearChat", "Chat cleared."}
    };
}
string HakimiEngine::t(const string& key) {
    if (texts.find(lang) != texts.end() && texts[lang].find(key) != texts[lang].end())
        return texts[lang][key];
    if (texts["中文"].find(key) != texts["中文"].end())
        return texts["中文"][key];
    return key;
}
string HakimiEngine::getMainMenu() {
    return t("menu0") + "\n" + t("menu1") + "\n" + t("menu2") + "\n" + t("menu3") + "\n" + t("menu4");
}
vector<string> HakimiEngine::processInput(const string& input) {
    vector<string> replies;
    string trimmed = input;
    size_t start = trimmed.find_first_not_of(" \t\n\r");
    if (start == string::npos) return replies;
    trimmed = trimmed.substr(start);
    size_t end = trimmed.find_last_not_of(" \t\n\r");
    if (end != string::npos) trimmed = trimmed.substr(0, end + 1);
    if (state == 2) {
        if (trimmed == ":q" || trimmed == "exit" || trimmed == "q") {
            replies.push_back(t("exitEcho"));
            state = 0;
            replies.push_back(getMainMenu());
        } else {
            replies.push_back(trimmed);
        }
        return replies;
    }
    if (state == 1) {
        int num;
        try {
            num = stoi(trimmed);
            int result = 114514 + num;
            replies.push_back(t("addResult1"));
            replies.push_back(t("addResult2") + to_string(result) + t("addResult3"));
            replies.push_back(t("addFooter"));
            state = 0;
            replies.push_back(getMainMenu());
        } catch (...) {
            replies.push_back(t("inputError"));
            replies.push_back(t("promptAdd"));
        }
        return replies;
    }
    if (trimmed == "1") {
        state = 1;
        replies.push_back(t("promptAdd"));
    } else if (trimmed == "2") {
        state = 2;
        replies.push_back(t("echoIntro"));
    } else if (trimmed == "3") {
        replies.push_back(t("exitProgram"));
        state = 0;
        replies.push_back(getMainMenu());
    } else if (trimmed == "4") {
        replies.push_back(t("clearChat"));
        replies.push_back(getMainMenu());
    } else {
        replies.push_back(t("invalidOption"));
        replies.push_back(getMainMenu());
    }
    return replies;
}
int main(int argc, char* argv[]) {
    const char* apiMode = getenv("HAKIMI_API_MODE");
    if (apiMode && string(apiMode) == "1") {
        string line;
        HakimiEngine engine;
        while (getline(cin, line)) {
            vector<string> replies = engine.processInput(line);
            for (const auto& r : replies) {
                cout << r << endl;
            }
            cout << "__END__" << endl;
            cout.flush();
        }
        return 0;
    }
    HakimiEngine engine;
    cout << engine.getWelcome() << endl;
    cout << engine.getMainMenu() << endl;
    string input;
    while (true) {
        cout << "> " << flush;
        if (!getline(cin, input)) {
            cin.clear();
            continue;
        }
        vector<string> replies = engine.processInput(input);
        for (const auto& r : replies) {
            cout << r << endl;
        }
        if (engine.getState() == 0 && input == "3") break;
    }
    return 0;
}
